export interface DetectionResult {
  age: number;
  gender: string;
  genderProbability: number;
  expressions: { [key: string]: number };
}

export interface PrimaryIdentity {
    bio: string;
    tags: string[];
    matchScore: number;
}

export interface AIResponse {
  primaryIdentity: PrimaryIdentity;
  alternatives: IdentityFragment[];
}

export interface IdentityFragment {
  text: string;
  gender: string;
  age: string;
  biasType: string;
}

export enum AppState {
  LOADING_MODELS = 'LOADING_MODELS',
  WAITING_FOR_FACE = 'WAITING_FOR_FACE', // Ready to start
  COUNTDOWN = 'COUNTDOWN',
  CAPTURING = 'CAPTURING', // Freezing frame
  GENERATING = 'GENERATING', // Calling API
  DISPLAYING = 'DISPLAYING', // Showing results
}
