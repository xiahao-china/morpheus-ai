import { h } from 'vue'

// 功能组图标
export const ImageUpscale = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M3 16V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
  h('path', { d: 'm8 12 2 2 4-4' }),
  h('path', { d: 'M15 2v4' }),
  h('path', { d: 'M15 20v4' }),
  h('path', { d: 'M2 15h4' }),
  h('path', { d: 'M20 15h4' })
])

export const Crop = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M6 2v14a2 2 0 0 0 2 2h14' }),
  h('path', { d: 'm18 6-8 8' }),
  h('path', { d: 'm22 2-8 8' })
])

export const ImagePlus = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M16 5h6' }),
  h('path', { d: 'M19 2v6' }),
  h('path', { d: 'M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5' }),
  h('path', { d: 'm9 15 2 2 4-4' })
])

export const Images = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M18 22H4a2 2 0 0 1-2-2V6' }),
  h('path', { d: 'm22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18' }),
  h('rect', { width: '14', height: '14', x: '8', y: '2', rx: '2' })
])

export const PencilRuler = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'm13 5 4 4L6 20v-4l11-11z' }),
  h('path', { d: 'm8 9 4 4' }),
  h('path', { d: 'M3 21h18' })
])

export const Eraser = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'm7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21' }),
  h('path', { d: 'M22 21H7' }),
  h('path', { d: 'm5 11 9 9' })
])

// 绘图工具图标
export const DrawBrush = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'm9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08' }),
  h('path', { d: 'M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z' })
])

export const Lasso = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M7 18a4.6 4.4 0 0 1 0-9 5 4.5 0 0 1 11 2h1a2 2 0 0 1 0 4h-1c0 1.6-.7 3-2 4l-2 2-3-3' }),
  h('path', { d: 'm3 14 3 3 3-3' })
])

export const Trash = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M3 6h18' }),
  h('path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }),
  h('path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' })
])

export const Undo2 = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M9 14 4 9l5-5' }),
  h('path', { d: 'M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11' })
])

export const Redo2 = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'm15 14 5-5-5-5' }),
  h('path', { d: 'M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13' })
])

export const SquareDashedMousePointer = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M5 3a2 2 0 0 0-2 2' }),
  h('path', { d: 'M19 3a2 2 0 0 1 2 2' }),
  h('path', { d: 'M21 19a2 2 0 0 1-2 2' }),
  h('path', { d: 'M5 21a2 2 0 0 1-2-2' }),
  h('path', { d: 'M9 3h1' }),
  h('path', { d: 'M9 21h1' }),
  h('path', { d: 'M14 3h1' }),
  h('path', { d: 'M14 21h1' }),
  h('path', { d: 'M3 9v1' }),
  h('path', { d: 'M21 9v1' }),
  h('path', { d: 'M3 14v1' }),
  h('path', { d: 'M21 14v1' }),
  h('path', { d: 'M13 2v6l3 3-3 3v6' })
])

export const MousePointerClick = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'm9 9 5 12 1.8-5.2L21 14Z' }),
  h('path', { d: 'M16.8 3.9a2.1 2.1 0 0 0-3.6 0l-1.9 3.3a2.1 2.1 0 0 0 .7 2.9l1.6.9' }),
  h('path', { d: 'M7 22V12l5-5' })
])

// 其他常用图标
export const Link = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }),
  h('path', { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' })
])

export const CircleQuestionMark = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
  h('path', { d: 'M12 17h.01' })
])

export const Check = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'm9 12 2 2 4-4' })
])

export const ChevronLeft = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'm15 18-6-6 6-6' })
])

export const ChevronRight = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'm9 18 6-6-6-6' })
])

export const History = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }),
  h('path', { d: 'M3 3v5h5' }),
  h('path', { d: 'M12 7v5l4 2' })
])

export const Upload = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
  h('polyline', { points: '17,8 12,3 7,8' }),
  h('line', { x1: '12', x2: '12', y1: '3', y2: '15' })
])

export const Loading = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' })
])

export const Lock = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('rect', { width: '18', height: '11', x: '3', y: '11', rx: '2', ry: '2' }),
  h('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' })
])

// NavigationBar 图标
export const Bell = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' }),
  h('path', { d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' })
])

export const User = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: '12', cy: '7', r: '4' })
])

export const Setting = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }),
  h('circle', { cx: '12', cy: '12', r: '3' })
])

export const SwitchButton = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M16 3h3v5' }),
  h('path', { d: 'm19 3-7 7-4-4-5 5' }),
  h('path', { d: 'M8 21H5v-5' }),
  h('path', { d: 'm5 21 7-7 4 4 5-5' })
])

export const GraduationCap = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '24',
  height: '24'
}, [
  h('path', { d: 'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z' }),
  h('path', { d: 'M22 10v6' }),
  h('path', { d: 'M6 12.5V16a6 3 0 0 0 12 0v-3.5' })
])