import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, tus-resumable, upload-offset, upload-length, upload-metadata',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
  'Access-Control-Expose-Headers': 'upload-offset, upload-length, tus-resumable, Location',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // TUS Protocol Implementation
    const method = req.method
    const tusResumable = req.headers.get('tus-resumable')

    if (method === 'POST' && tusResumable === '1.0.0') {
      // Create new upload session
      const uploadLength = req.headers.get('upload-length')
      const uploadMetadata = req.headers.get('upload-metadata')
      
      if (!uploadLength) {
        return new Response('Missing upload-length header', { 
          status: 400,
          headers: corsHeaders 
        })
      }

      // Decode metadata to get filename
      let filename = 'upload.mp4'
      if (uploadMetadata) {
        const metadata = uploadMetadata.split(',').reduce((acc, pair) => {
          const [key, value] = pair.trim().split(' ')
          acc[key] = value ? atob(value) : ''
          return acc
        }, {} as Record<string, string>)
        filename = metadata.filename || filename
      }

      const uploadId = crypto.randomUUID()
      // Force HTTPS for the location header to prevent TUS client issues
      const uploadUrl = `https://jybewogjncaoscrnlqum.functions.supabase.co/video-upload/${uploadId}`

      console.log(`Created upload session: ${uploadId}`)

      return new Response(null, {
        status: 201,
        headers: {
          ...corsHeaders,
          'tus-resumable': '1.0.0',
          'Location': uploadUrl, // Use uppercase Location header
          'upload-expires': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        }
      })
    }

    if (method === 'PATCH' && tusResumable === '1.0.0') {
      // Upload chunk
      const uploadId = url.pathname.split('/').pop()
      const uploadOffset = parseInt(req.headers.get('upload-offset') || '0')
      const chunk = new Uint8Array(await req.arrayBuffer())

      console.log(`Uploading chunk for ${uploadId}: offset ${uploadOffset}, size ${chunk.length}`)

      // Store chunk in temporary storage (using Supabase storage as temp)
      const tempPath = `temp/${uploadId}/${uploadOffset}`
      const { error } = await supabase.storage
        .from('videos')
        .upload(tempPath, chunk, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error(`Error uploading chunk: ${error.message}`)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'content-type': 'application/json' }
        })
      }

      const newOffset = uploadOffset + chunk.length

      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'tus-resumable': '1.0.0',
          'upload-offset': newOffset.toString(),
        }
      })
    }

    if (method === 'HEAD' && tusResumable === '1.0.0') {
      // Get upload progress
      const uploadId = url.pathname.split('/').pop()
      
      // List all chunks to calculate offset
      const { data: files } = await supabase.storage
        .from('videos')
        .list(`temp/${uploadId}`, { sortBy: { column: 'name', order: 'asc' } })

      let totalOffset = 0
      if (files) {
        for (const file of files) {
          const offset = parseInt(file.name)
          if (!isNaN(offset)) {
            totalOffset = Math.max(totalOffset, offset + (file.metadata?.size || 0))
          }
        }
      }

      return new Response(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          'tus-resumable': '1.0.0',
          'upload-offset': totalOffset.toString(),
        }
      })
    }

    // Finalize upload
    if (method === 'PUT' && url.searchParams.get('finalize') === 'true') {
      const uploadId = url.searchParams.get('id')
      const filename = url.searchParams.get('filename') || 'video.mp4'

      if (!uploadId) {
        return new Response('Missing upload ID', { status: 400, headers: corsHeaders })
      }

      // Background task to assemble chunks
      const assembleTask = async () => {
        try {
          // Get all chunks
          const { data: files } = await supabase.storage
            .from('videos')
            .list(`temp/${uploadId}`, { sortBy: { column: 'name', order: 'asc' } })

          if (!files || files.length === 0) {
            throw new Error('No chunks found')
          }

          // Download and assemble chunks
          const chunks: Uint8Array[] = []
          for (const file of files.sort((a, b) => parseInt(a.name) - parseInt(b.name))) {
            const { data: chunkData } = await supabase.storage
              .from('videos')
              .download(`temp/${uploadId}/${file.name}`)
            
            if (chunkData) {
              chunks.push(new Uint8Array(await chunkData.arrayBuffer()))
            }
          }

          // Combine all chunks
          const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
          const finalFile = new Uint8Array(totalSize)
          let offset = 0
          for (const chunk of chunks) {
            finalFile.set(chunk, offset)
            offset += chunk.length
          }

          // Upload final file
          await supabase.storage
            .from('videos')
            .upload(filename, finalFile, {
              cacheControl: '3600',
              upsert: true,
              contentType: 'video/mp4'
            })

          // Cleanup temp files
          for (const file of files) {
            await supabase.storage
              .from('videos')
              .remove([`temp/${uploadId}/${file.name}`])
          }

          console.log(`Successfully assembled and uploaded: ${filename}`)
        } catch (error) {
          console.error('Error assembling upload:', error)
        }
      }

      // Start background assembly
      EdgeRuntime.waitUntil(assembleTask())

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Upload finalization started',
        filename 
      }), {
        status: 200,
        headers: { 
          ...corsHeaders,
          'content-type': 'application/json' 
        }
      })
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        'content-type': 'application/json' 
      }
    })
  }
})