import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center, Html, PresentationControls } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as THREE from 'three';

interface ModelProps {
  url: string;
  autoRotate?: boolean;
}

function Model({ url, autoRotate = true }: ModelProps) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <Center>
      <primitive ref={ref} object={scene} scale={1} />
    </Center>
  );
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading 3D Model...</p>
      </div>
    </Html>
  );
}

function ErrorFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-destructive">
        <p className="text-sm">Failed to load 3D model</p>
      </div>
    </Html>
  );
}

interface ModelViewerProps {
  url: string;
  className?: string;
  aspectRatio?: 'video' | 'square';
}

export function ModelViewer({ url, className, aspectRatio = 'video' }: ModelViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.5);
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.5);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const aspectClass = aspectRatio === 'video' ? 'aspect-video' : 'aspect-square';

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50",
        aspectClass,
        isFullscreen && "!aspect-auto w-full h-full",
        className
      )}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={<LoadingSpinner />}>
          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            rotation={[0, 0.3, 0]}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Math.PI / 1.4, Math.PI / 2]}
          >
            <Model url={url} autoRotate={autoRotate} />
          </PresentationControls>
          <Environment preset="city" />
        </Suspense>
        
        <OrbitControls 
          ref={controlsRef}
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          autoRotate={false}
        />
      </Canvas>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-1">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
        <Button variant="ghost" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button 
          variant={autoRotate ? "secondary" : "ghost"} 
          size="sm" 
          onClick={() => setAutoRotate(!autoRotate)}
        >
          Auto
        </Button>
      </div>
    </div>
  );
}

// Simple placeholder for when no 3D model is available
export function ModelViewerPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn(
      "aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center",
      className
    )}>
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Loader2 className="h-10 w-10 text-accent animate-spin" />
        </div>
        <p className="text-lg font-medium mb-2">3D Model Viewer</p>
        <p className="text-sm text-muted-foreground">Upload a GLB/GLTF model to view</p>
      </div>
    </div>
  );
}
