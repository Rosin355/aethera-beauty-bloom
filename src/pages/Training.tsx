import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, CheckCircle, Lock } from "lucide-react";
import { checkVideoExists, getVideoUrl } from "@/lib/videoStorage";

const Training = () => {
  const [previewVideoExists, setPreviewVideoExists] = useState(false);
  const [fullVideoExists, setFullVideoExists] = useState(false);

  useEffect(() => {
    checkVideos();
  }, []);

  const checkVideos = async () => {
    const previewExists = await checkVideoExists('video-anteprima.mp4');
    const fullExists = await checkVideoExists('video-completo.mp4');
    setPreviewVideoExists(previewExists);
    setFullVideoExists(fullExists);
  };

  const courses = [
    {
      id: 1,
      title: "Video Anteprima - Introduzione ai 4 Elementi",
      description: "Un'introduzione ai principi fondamentali dei 4 elementi nel trattamento della bellezza.",
      duration: "15 min",
      level: "Principiante",
      videoFile: 'video-anteprima.mp4',
      exists: previewVideoExists,
      isPreview: true,
      completed: false,
    },
    {
      id: 2,
      title: "Corso Completo - I 4 Elementi nella Pratica",
      description: "Corso completo sull'applicazione pratica dei 4 elementi: acqua, fuoco, aria e terra nel trattamento estetico.",
      duration: "45 min",
      level: "Intermedio",
      videoFile: 'video-completo.mp4',
      exists: fullVideoExists,
      isPreview: false,
      completed: false,
    }
  ];

  const handleWatchVideo = (videoFile: string) => {
    const videoUrl = getVideoUrl(videoFile);
    window.open(videoUrl, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-playfair text-white">
              Formazione Online
            </h1>
            <p className="text-neutral-400 mt-2">
              Accedi ai corsi video sui 4 elementi per migliorare le tue competenze professionali
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="glass border border-neutral-800 hover:border-neutral-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg font-playfair mb-2">
                      {course.title}
                    </CardTitle>
                    <p className="text-neutral-400 text-sm">
                      {course.description}
                    </p>
                  </div>
                  {course.completed && (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className="text-xs">
                    {course.level}
                  </Badge>
                  <div className="flex items-center gap-1 text-neutral-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">{course.duration}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Video Preview Area */}
                  <div className="aspect-video bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {course.exists ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-brand-fire rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                        <p className="text-white text-sm">Video disponibile</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center">
                          <Lock className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-400 text-sm">Video non ancora disponibile</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      disabled={!course.exists}
                      onClick={() => handleWatchVideo(course.videoFile)}
                    >
                      {course.exists ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Guarda Video
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Non Disponibile
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Course Status */}
                  <div className="text-xs text-neutral-500">
                    {course.exists ? (
                      <p>✓ Video caricato e pronto per la visione</p>
                    ) : (
                      <p>Il video verrà pubblicato a breve</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="glass border border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white font-playfair">
              Come funziona la formazione
            </CardTitle>
          </CardHeader>
          <CardContent className="text-neutral-400 space-y-2">
            <p>• I video sono ottimizzati per la migliore esperienza di visione</p>
            <p>• Ogni corso include materiali scaricabili e certificati</p>
            <p>• Puoi rivedere i video tutte le volte che vuoi</p>
            <p>• I nuovi contenuti vengono aggiunti regolarmente</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Training;