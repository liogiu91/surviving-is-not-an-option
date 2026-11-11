// Centralized image assets and sprite-sheet dimensions.
// Independent illustrated sneaker sprite (embedded so the HTML stays portable).
export const giantessSprite=new Image();
export const officeShoeSprite=new Image();
export const officeTwistSprite=new Image();
export const officeDefeatImage=new Image();
export const gymDefeatImage=new Image();
export const classroomDefeatImage=new Image();
classroomDefeatImage.src='assets/scenes/classroom-defeat.jpg';
gymDefeatImage.src='assets/scenes/gym-defeat.jpg';
officeDefeatImage.src='assets/scenes/office-defeat.jpg';
officeTwistSprite.src='assets/sprites/office-twist.png';
officeShoeSprite.src='assets/sprites/office-shoe.png';
export const OFFICE_FRAME_W=1086, OFFICE_FRAME_H=724;
export const OFFICE_TWIST_FRAME_W=1086, OFFICE_TWIST_FRAME_H=724, OFFICE_TWIST_FRAMES=8;
// Aula 5F: Mary Jane nera con calza bianca, 8 frame trasparenti (4x2).
export const classroomShoeSprite=new Image();
classroomShoeSprite.src='assets/sprites/classroom-shoe.png';
export const classroomInspectionExtendedSprite=new Image();
classroomInspectionExtendedSprite.src='assets/sprites/classroom-inspection-extended.png';
export const CLASSROOM_FRAME_W=444, CLASSROOM_FRAME_H=444;
// Aula 5F finisher: eight-frame backward sole-scrub animation, chroma-keyed and transparent.
export const CLASSROOM_FINISHER_FRAME_W=444, CLASSROOM_FINISHER_FRAME_H=444, CLASSROOM_FINISHER_FRAMES=8;
export const classroomFinisherSprite=new Image();
classroomFinisherSprite.src='assets/sprites/classroom-finisher.png';


giantessSprite.src='assets/sprites/gym-giantess.png';
export const GIANTESS_FRAMES=8, GIANTESS_FRAME_W=560, GIANTESS_FRAME_H=400;
export const heroSprite=new Image();
heroSprite.src='assets/sprites/player-hero.png';
export const HERO_CELL=176;
export const impactFX=new Image(), puddleFX=new Image();
export const stickyBloodFX=new Image();
stickyBloodFX.src='assets/effects/sticky-blood.png';
export const STICKY_BLOOD_FRAME_W=163, STICKY_BLOOD_FRAME_H=640, STICKY_BLOOD_FRAMES=12;
impactFX.src='assets/effects/impact.png';
puddleFX.src='assets/effects/blood-puddle.png';
export const FX_IMPACT_W=176, FX_POOL_W=190;
// Build 3.0 — background illustrato della palestra, incorporato nel file.
export const gymBackground = new Image();
export const officeBackground = new Image();
export const classroomBackground = new Image();
classroomBackground.src = 'assets/backgrounds/classroom.webp';
officeBackground.src = 'assets/backgrounds/office.webp';
gymBackground.src = 'assets/backgrounds/gym.webp';

export const classroomBloodDragSprite=new Image();
classroomBloodDragSprite.src='assets/effects/classroom-blood-drag.png';
export const CLASSROOM_BLOOD_FRAME_W=543, CLASSROOM_BLOOD_FRAME_H=180;
