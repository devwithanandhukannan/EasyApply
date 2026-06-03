// app/lib/attentionTracker.ts

export interface AttentionUpdate {
  attentionScore: number;
  noFaceWarning: boolean;
  multipleFaceWarning: boolean;
  lookingAwayWarning: boolean;
  consecutiveNoFaceTime: number;
  consecutiveLookingAwayTime: number;
  consecutiveMultipleFaceTime: number;
}

export class AttentionTracker {
  private attentionScore: number = 100;
  private lastUpdateTimestamp: number = Date.now();

  private noFaceTime: number = 0;
  private lookingAwayTime: number = 0;
  private multipleFacesTime: number = 0;

  // Thresholds (milliseconds)
  private readonly NO_FACE_THRESHOLD = 5000;
  private readonly LOOKING_AWAY_THRESHOLD = 3000;
  private readonly MULTIPLE_FACES_THRESHOLD = 2000;

  // Score decay per second (not per arbitrary frame)
  private readonly NO_FACE_PENALTY_PER_SEC = 20;    // 20 points/sec
  private readonly LOOKING_AWAY_PENALTY_PER_SEC = 10;
  private readonly MULTIPLE_FACES_PENALTY_PER_SEC = 15;

  // Score recovery per second
  private readonly RECOVERY_PER_SEC = 5;

  update(faceCount: number, lookingAway: boolean): AttentionUpdate {
    const now = Date.now();
    let deltaSec = (now - this.lastUpdateTimestamp) / 1000;
    // Clamp delta to avoid large jumps (max 0.5 sec)
    deltaSec = Math.min(deltaSec, 0.5);
    this.lastUpdateTimestamp = now;

    // Update violation timers
    if (faceCount === 0) {
      this.noFaceTime += deltaSec * 1000;
      this.attentionScore -= this.NO_FACE_PENALTY_PER_SEC * deltaSec;
    } else {
      this.noFaceTime = 0;
    }

    if (lookingAway && faceCount === 1) {
      this.lookingAwayTime += deltaSec * 1000;
      this.attentionScore -= this.LOOKING_AWAY_PENALTY_PER_SEC * deltaSec;
    } else {
      this.lookingAwayTime = 0;
    }

    if (faceCount > 1) {
      this.multipleFacesTime += deltaSec * 1000;
      this.attentionScore -= this.MULTIPLE_FACES_PENALTY_PER_SEC * deltaSec;
    } else {
      this.multipleFacesTime = 0;
    }

    // Recovery when attentive
    if (faceCount === 1 && !lookingAway) {
      this.attentionScore += this.RECOVERY_PER_SEC * deltaSec;
    }

    // Clamp score between 0 and 100
    this.attentionScore = Math.min(100, Math.max(0, this.attentionScore));

    return {
      attentionScore: Math.round(this.attentionScore),
      noFaceWarning: this.noFaceTime > this.NO_FACE_THRESHOLD,
      multipleFaceWarning: this.multipleFacesTime > this.MULTIPLE_FACES_THRESHOLD,
      lookingAwayWarning: this.lookingAwayTime > this.LOOKING_AWAY_THRESHOLD,
      consecutiveNoFaceTime: this.noFaceTime,
      consecutiveLookingAwayTime: this.lookingAwayTime,
      consecutiveMultipleFaceTime: this.multipleFacesTime,
    };
  }

  reset(): void {
    this.attentionScore = 100;
    this.noFaceTime = 0;
    this.lookingAwayTime = 0;
    this.multipleFacesTime = 0;
    this.lastUpdateTimestamp = Date.now();
  }

  getScore(): number {
    return Math.round(this.attentionScore);
  }
}