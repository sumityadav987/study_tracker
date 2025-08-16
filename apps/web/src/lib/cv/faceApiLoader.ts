import * as faceapi from 'face-api.js';

export interface FaceDetectionResult {
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
  expressions: faceapi.FaceExpressions;
}

export interface CVMetrics {
  facePresent: boolean;
  eyesClosed: boolean;
  yawning: boolean;
  lookingAway: boolean;
  expressionLabel: string;
  expressionScores: Record<string, number>;
  eyeAspectRatio: number;
  mouthOpenRatio: number;
}

class FaceAPILoader {
  private initialized = false;
  private warmupComplete = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load models from CDN or local static files
      const modelUrl = '/models'; // Assuming models are served from public/models
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
        faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
      ]);

      this.initialized = true;
      console.log('Face API models loaded successfully');
    } catch (error) {
      console.error('Failed to load Face API models:', error);
      throw new Error('Failed to initialize face detection models');
    }
  }

  async warmup(video: HTMLVideoElement): Promise<void> {
    if (this.warmupComplete) return;

    try {
      // Run a few detection cycles to warm up the models
      for (let i = 0; i < 3; i++) {
        await this.detectFace(video);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.warmupComplete = true;
      console.log('Face API warmup complete');
    } catch (error) {
      console.warn('Face API warmup failed:', error);
    }
  }

  async detectFace(video: HTMLVideoElement): Promise<FaceDetectionResult | null> {
    if (!this.initialized) {
      throw new Error('Face API not initialized');
    }

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detection) return null;

      return {
        detection: detection.detection,
        landmarks: detection.landmarks,
        expressions: detection.expressions,
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  calculateEyeAspectRatio(landmarks: faceapi.FaceLandmarks68): number {
    // Calculate Eye Aspect Ratio (EAR) for both eyes
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const leftEAR = this.calculateSingleEyeAR(leftEye);
    const rightEAR = this.calculateSingleEyeAR(rightEye);

    return (leftEAR + rightEAR) / 2;
  }

  private calculateSingleEyeAR(eyePoints: faceapi.Point[]): number {
    // EAR formula: (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
    const p1 = eyePoints[0]; // left corner
    const p2 = eyePoints[1]; // top left
    const p3 = eyePoints[2]; // top right  
    const p4 = eyePoints[3]; // right corner
    const p5 = eyePoints[4]; // bottom right
    const p6 = eyePoints[5]; // bottom left

    const verticalDist1 = this.distance(p2, p6);
    const verticalDist2 = this.distance(p3, p5);
    const horizontalDist = this.distance(p1, p4);

    return (verticalDist1 + verticalDist2) / (2 * horizontalDist);
  }

  calculateMouthOpenRatio(landmarks: faceapi.FaceLandmarks68): number {
    const mouth = landmarks.getMouth();
    
    // Calculate mouth aspect ratio
    const topLip = mouth[13]; // top center
    const bottomLip = mouth[19]; // bottom center
    const leftCorner = mouth[0]; // left corner
    const rightCorner = mouth[6]; // right corner

    const verticalDist = this.distance(topLip, bottomLip);
    const horizontalDist = this.distance(leftCorner, rightCorner);

    return verticalDist / horizontalDist;
  }

  private distance(p1: faceapi.Point, p2: faceapi.Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  extractMetrics(
    result: FaceDetectionResult | null,
    videoElement: HTMLVideoElement,
    thresholds: {
      eyeClosedThreshold: number;
      yawnThreshold: number;
      lookAwayThreshold: number;
    }
  ): CVMetrics {
    if (!result) {
      return {
        facePresent: false,
        eyesClosed: false,
        yawning: false,
        lookingAway: true,
        expressionLabel: 'unknown',
        expressionScores: {},
        eyeAspectRatio: 0,
        mouthOpenRatio: 0,
      };
    }

    const { detection, landmarks, expressions } = result;
    
    // Calculate metrics
    const eyeAspectRatio = this.calculateEyeAspectRatio(landmarks);
    const mouthOpenRatio = this.calculateMouthOpenRatio(landmarks);
    
    // Determine eye state
    const eyesClosed = eyeAspectRatio < thresholds.eyeClosedThreshold;
    
    // Determine if yawning
    const yawning = mouthOpenRatio > thresholds.yawnThreshold;
    
    // Check if looking away (face detection box significantly off-center)
    const centerX = videoElement.videoWidth / 2;
    const centerY = videoElement.videoHeight / 2;
    const faceCenter = detection.box.center;
    
    const distanceFromCenter = Math.sqrt(
      Math.pow(faceCenter.x - centerX, 2) + Math.pow(faceCenter.y - centerY, 2)
    );
    const maxDistance = Math.min(videoElement.videoWidth, videoElement.videoHeight) * 0.3;
    const lookingAway = distanceFromCenter > maxDistance;
    
    // Get dominant expression
    const expressionScores = expressions.asSortedArray();
    const expressionLabel = expressionScores[0]?.expression || 'neutral';

    return {
      facePresent: true,
      eyesClosed,
      yawning,
      lookingAway,
      expressionLabel,
      expressionScores: expressions.asObject(),
      eyeAspectRatio,
      mouthOpenRatio,
    };
  }
}

export const faceAPILoader = new FaceAPILoader();