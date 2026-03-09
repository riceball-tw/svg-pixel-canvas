import heartSvg from './assets/presets/heart.svg?raw';
import smileSvg from './assets/presets/smile.svg?raw';
import treeSvg from './assets/presets/tree.svg?raw';


export type BuiltInGallerySource = {
  id: string;
  name: string;
  description: string;
  svg: string;
};

export const builtInGallerySources: BuiltInGallerySource[] = [
  {
    id: 'preset-heart',
    name: 'Heart',
    description: '8x8 red heart icon',
    svg: heartSvg,
  },
  {
    id: 'preset-smile',
    name: 'Smile',
    description: '8x8 happy face',
    svg: smileSvg,
  },
  {
    id: 'preset-tree',
    name: 'Tree',
    description: '8x8 tiny pine tree',
    svg: treeSvg,
  },
];
