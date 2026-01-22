export type AspectRatioType = 'auto' | '1:1' | '16:9' | '4:3' | '2:3' | '3:4';

export const getAspectRatioClass = (aspectRatio: AspectRatioType | string | null | undefined): string => {
  switch (aspectRatio) {
    case '1:1': return 'aspect-square';
    case '16:9': return 'aspect-video';
    case '4:3': return 'aspect-[4/3]';
    case '2:3': return 'aspect-[2/3]';
    case '3:4': return 'aspect-[3/4]';
    default: return 'aspect-[4/3]'; // default for cards
  }
};

export const getAspectRatioStyle = (aspectRatio: AspectRatioType | string | null | undefined): React.CSSProperties => {
  switch (aspectRatio) {
    case '1:1': return { aspectRatio: '1 / 1' };
    case '16:9': return { aspectRatio: '16 / 9' };
    case '4:3': return { aspectRatio: '4 / 3' };
    case '2:3': return { aspectRatio: '2 / 3' };
    case '3:4': return { aspectRatio: '3 / 4' };
    default: return { aspectRatio: '4 / 3' };
  }
};

export const ASPECT_RATIO_OPTIONS = [
  { value: 'auto' as AspectRatioType, label: 'Auto', description: 'Sesuai gambar asli' },
  { value: '1:1' as AspectRatioType, label: 'Square', description: 'Kotak (1:1)' },
  { value: '16:9' as AspectRatioType, label: 'Wide', description: 'Layar lebar (16:9)' },
  { value: '4:3' as AspectRatioType, label: 'Standard', description: 'Standar (4:3)' },
  { value: '2:3' as AspectRatioType, label: 'Portrait', description: 'Potret (2:3)' },
  { value: '3:4' as AspectRatioType, label: 'Tall', description: 'Tinggi (3:4)' },
];
