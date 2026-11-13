/**
 * Archivio centralizzato degli asset grafici.
 * Qui vengono create le immagini, assegnati i percorsi e dichiarate le
 * dimensioni dei fotogrammi usate per ritagliare gli sprite sheet.
 */
// Archivio centrale delle immagini e delle dimensioni degli sprite sheet.
// Sprite illustrato indipendente della sneaker della palestra.
export const giantessSprite=new Image();
export const officeShoeSprite=new Image();
export const officeTwistSprite=new Image();
export const officeDefeatImage=new Image();
export const gymDefeatImage=new Image();
export const classroomDefeatImage=new Image();
export const poolDefeatImage=new Image();
export const cafeteriaDefeatImage=new Image();
export const poolBackground=new Image();
export const poolWedgeSprite=new Image();
export const poolFinisherSprite=new Image();
poolBackground.src='assets/backgrounds/pool.webp';
poolWedgeSprite.src='assets/sprites/pool-wedge.png';
poolFinisherSprite.src='assets/sprites/pool-finisher.png';
export const POOL_FRAME_W=543, POOL_FRAME_H=362, POOL_FRAMES=8;
export const POOL_FINISHER_FRAME_W=543, POOL_FINISHER_FRAME_H=362, POOL_FINISHER_FRAMES=8;
classroomDefeatImage.src='assets/scenes/classroom-defeat.jpg';
poolDefeatImage.src='assets/scenes/pool-defeat.jpg';
gymDefeatImage.src='assets/scenes/gym-defeat.jpg';
officeDefeatImage.src='assets/scenes/office-defeat.jpg';
cafeteriaDefeatImage.src='assets/scenes/cafeteria-defeat.png';
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
// Finisher dell’Aula 5F: otto fotogrammi dello sfregamento all’indietro della suola.
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
// Sfondo illustrato della palestra.
export const gymBackground = new Image();
export const officeBackground = new Image();
export const classroomBackground = new Image();
classroomBackground.src = 'assets/backgrounds/classroom.webp';
officeBackground.src = 'assets/backgrounds/office.webp';
gymBackground.src = 'assets/backgrounds/gym.webp';

export const classroomBloodDragSprite=new Image();
classroomBloodDragSprite.src='assets/effects/classroom-blood-drag.png';
export const CLASSROOM_BLOOD_FRAME_W=543, CLASSROOM_BLOOD_FRAME_H=180;

// Level 5 — mensa: mocassino rosa lucido, 8 frame (4x2) e sfondo rasoterra.
export const cafeteriaBackground = new Image();
export const cafeteriaLoaferSprite = new Image();
cafeteriaBackground.src='assets/backgrounds/cafeteria.webp';
cafeteriaLoaferSprite.src='assets/sprites/cafeteria-loafer.png';
export const CAFETERIA_FRAME_W=444, CAFETERIA_FRAME_H=444, CAFETERIA_FRAMES=8;
