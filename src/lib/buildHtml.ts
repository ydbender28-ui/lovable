import ts from "typescript";
import { SECTION_COMPONENTS } from "./section-components";
import { UI_COMPONENTS } from "./ui-components";
import { EXTRA_COMPONENTS } from "./extra-components";

export type ProjectFiles = Record<string, string>;

const REACT_CDN = "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js";
const REACT_DOM_CDN = "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js";

// Stub lucide-react icons as simple SVG components so published apps don't crash
const LUCIDE_STUB = `var _ic=function(d){return function(p){var s=(p&&p.size)||24;var col=(p&&p.color)||'currentColor';return React.createElement('svg',{width:s,height:s,viewBox:'0 0 24 24',fill:'none',stroke:col,strokeWidth:p&&p.strokeWidth||2,strokeLinecap:'round',strokeLinejoin:'round',style:(p&&p.style)||{},className:(p&&p.className)||''},React.createElement('path',{d:d}));}};
var ShoppingCart=_ic('M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6');
var ShoppingBag=_ic('M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0');
var MapPin=_ic('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z');
var Phone=_ic('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72');
var Clock=_ic('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2');
var Mail=_ic('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6');
var Star=_ic('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
var Heart=_ic('M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z');
var Search=_ic('M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5zM21 21l-4.35-4.35');
var Menu=_ic('M3 12h18M3 6h18M3 18h18');
var X=_ic('M18 6L6 18M6 6l12 12');
var ChevronDown=_ic('M6 9l6 6 6-6');
var ChevronUp=_ic('M18 15l-6-6-6 6');
var ChevronRight=_ic('M9 18l6-6-6-6');
var ChevronLeft=_ic('M15 18l-6-6 6-6');
var ArrowRight=_ic('M5 12h14M12 5l7 7-7 7');
var ArrowLeft=_ic('M19 12H5M12 19l-7-7 7-7');
var ArrowUp=_ic('M12 19V5M5 12l7-7 7 7');
var ArrowDown=_ic('M12 5v14M19 12l-7 7-7-7');
var Check=_ic('M20 6L9 17l-5-5');
var CheckCircle=_ic('M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3');
var CheckCircle2=_ic('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9 12l2 2 4-4');
var Circle=_ic('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z');
var Plus=_ic('M12 5v14M5 12h14');
var Minus=_ic('M5 12h14');
var Trash2=_ic('M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2');
var Eye=_ic('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z');
var EyeOff=_ic('M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22');
var User=_ic('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z');
var Users=_ic('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75');
var Settings=_ic('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z');
var Home=_ic('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z');
var Calendar=_ic('M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18');
var Filter=_ic('M22 3H2l8 9.46V19l4 2v-8.54L22 3z');
var ExternalLink=_ic('M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3');
var Link=_ic('M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71');
var Globe=_ic('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z');
var Truck=_ic('M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z');
var Package=_ic('M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12');
var Store=_ic('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10');
var Tag=_ic('M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01');
var Percent=_ic('M19 5L5 19M6.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 15a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z');
var Gift=_ic('M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z');
var Coffee=_ic('M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3');
var Pizza=_ic('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32');
var UtensilsCrossed=_ic('M16 2v4l-4 6v10M8 2v16l4-4M2 7h14');
var Utensils=_ic('M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7');
var Flame=_ic('M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z');
var Zap=_ic('M13 2L3 14h9l-1 8 10-12h-9l1-8z');
var Shield=_ic('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
var Lock=_ic('M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4');
var Unlock=_ic('M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 9.9-1');
var Bell=_ic('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0');
var BellOff=_ic('M8.56 2.9A7 7 0 0 1 19 9v4m-2 4H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7M9 17v1a3 3 0 0 0 6 0v-1M1 1l22 22');
var Info=_ic('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8h.01M12 12v4');
var AlertCircle=_ic('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01');
var AlertTriangle=_ic('M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01');
var BarChart2=_ic('M18 20V10M12 20V4M6 20v-6');
var BarChart=_ic('M12 20V10M18 20V4M6 20v-6');
var LineChart=_ic('M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3');
var PieChart=_ic('M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z');
var TrendingUp=_ic('M23 6l-9.5 9.5-5-5L1 18M17 6h6v6');
var TrendingDown=_ic('M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6');
var Table=_ic('M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18');
var List=_ic('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01');
var Grid=_ic('M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z');
var Layout=_ic('M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM3 9h18M9 21V9');
var Layers=_ic('M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5');
var Copy=_ic('M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');
var Download=_ic('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3');
var Upload=_ic('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12');
var Share=_ic('M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13');
var Share2=_ic('M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 18 8a3 3 0 1 0-3-3c0 .24.04.47.09.7L8.04 9.81A3 3 0 0 0 6 9a3 3 0 1 0 3 3 2.99 2.99 0 0 0-.09-.7l7.05-4.11c.52.47 1.2.77 1.96.77a3 3 0 1 0 0-6z');
var Image=_ic('M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21');
var Video=_ic('M23 7l-7 5 7 5V7zM1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z');
var Music=_ic('M9 18V5l12-2v13M9 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM21 16a3 3 0 1 0-6 0 3 3 0 0 0 6 0z');
var MessageCircle=_ic('M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z');
var MessageSquare=_ic('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z');
var Send=_ic('M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z');
var Wifi=_ic('M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01');
var Smartphone=_ic('M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h.01');
var Laptop=_ic('M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16');
var Monitor=_ic('M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8 21h8M12 17v4');
var Sparkles=_ic('M12 3l1.88 5.76 5.76 1.88-5.76 1.88L12 18.28l-1.88-5.76L4.36 10.64l5.76-1.88L12 3z');
var Crown=_ic('M12 2L9.5 8.5 3 10l6 5-1.5 7L12 19l4.5 3L15 15l6-5-6.5-1.5L12 2z');
var Award=_ic('M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12');
var ThumbsUp=_ic('M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3');
var ThumbsDown=_ic('M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17');
var Bookmark=_ic('M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z');
var Flag=_ic('M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7');
var Map=_ic('M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16');
var Navigation=_ic('M3 11l19-9-9 19-2-8-8-2z');
var Compass=_ic('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z');
var Sun=_ic('M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42');
var Moon=_ic('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
var Cloud=_ic('M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z');
var Umbrella=_ic('M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7');
var Loader=_ic('M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83');
var RefreshCw=_ic('M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15');
var RotateCcw=_ic('M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10');
var Maximize=_ic('M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3');
var Minimize=_ic('M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3');
var Move=_ic('M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20');
var Edit=_ic('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z');
var Edit2=_ic('M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z');
var Pencil=_ic('M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z');
var Save=_ic('M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8');
var FileText=_ic('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8');
var File=_ic('M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM13 2v7h7');
var Folder=_ic('M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z');
var Code=_ic('M16 18l6-6-6-6M8 6l-6 6 6 6');
var Terminal=_ic('M4 17l6-6-6-6M12 19h8');
var Database=_ic('M12 2C8.13 2 5 3.79 5 6v12c0 2.21 3.13 4 7 4s7-1.79 7-4V6c0-2.21-3.13-4-7-4zM19 6c0 1.105-3.134 2-7 2S5 7.105 5 6M19 12c0 1.105-3.134 2-7 2s-7-.895-7-2');
var Server=_ic('M20 6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2zM20 14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2zM8 6h.01M8 14h.01');
var Cpu=_ic('M9 3H7a2 2 0 0 0-2 2v2M9 3h6M9 3v4h6V3m0 0h2a2 2 0 0 1 2 2v2M3 9v6M21 9v6M9 21H7a2 2 0 0 1-2-2v-2m4 4h6m-6 0v-4h6v4m0 0h2a2 2 0 0 0 2-2v-2M7 9h10v6H7z');
var Crosshair=_ic('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM22 12h-4M6 12H2M12 6V2M12 22v-4');
var Activity=_ic('M22 12h-4l-3 9L9 3l-3 9H2');
var Pulse=_ic('M22 12h-4l-3 9L9 3l-3 9H2');
var DollarSign=_ic('M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6');
var CreditCard=_ic('M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM1 10h22');
var Wallet=_ic('M21 12V7H5a2 2 0 0 1 0-4h14v4M21 12a2 2 0 0 1 0 4H5a2 2 0 0 1-2-2v-1');
var Receipt=_ic('M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1zM9 8h6M9 12h6M9 16h6');
var Building=_ic('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z');
var Building2=_ic('M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4');
var Briefcase=_ic('M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v4M10 14h4');
var Target=_ic('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z');
var Rocket=_ic('M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5');
var Lightbulb=_ic('M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V18H9v-3.8A6 6 0 0 1 6 9a6 6 0 0 1 6-6z');
var HelpCircle=_ic('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01');
var LogIn=_ic('M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3');
var LogOut=_ic('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9');
var Key=_ic('M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4');
var Maximize2=_ic('M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7');
var Minimize2=_ic('M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7');
var MoreHorizontal=_ic('M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z');
var MoreVertical=_ic('M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z');
var Ellipsis=MoreHorizontal;
var SlidersHorizontal=_ic('M21 4H8M6 4H3M21 12h-6M12 12H3M21 20h-3M15 20H3M8 2v4M12 10v4M18 18v4');
var Sliders=_ic('M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6');
`;


let _reactCache: { react: string; reactDom: string } | null = null;

export async function fetchReactScripts(): Promise<{ react: string; reactDom: string }> {
  if (_reactCache) return _reactCache;
  const [react, reactDom] = await Promise.all([
    fetch(REACT_CDN).then((r) => r.text()),
    fetch(REACT_DOM_CDN).then((r) => r.text()),
  ]);
  _reactCache = { react, reactDom };
  return _reactCache;
}

function stripModuleSyntax(code: string): string {
  return code
    .replace(/^import\s[^\n]+\n?/gm, "")
    .replace(/^export\s+default\s+(?=function|class|const|let|var|async)/gm, "")
    .replace(/^export\s+default\s+\w[\w.]*\s*;?\s*$/gm, "")
    .replace(/^export\s+(?=const|let|var|function|class|type|interface|enum)/gm, "")
    .replace(/^export\s*\{[^}]*\}\s*(?:from\s*['"][^'"]+['"])?\s*;?\s*$/gm, "");
}

function transpileTSX(code: string): string {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
      esModuleInterop: false,
      allowSyntheticDefaultImports: true,
    },
    fileName: "App.tsx",
  });
  return result.outputText;
}

function buildAppCode(projectFiles: ProjectFiles): { code: string; componentName: string; styles: string; title: string } {
  // Merge in pre-built components that the app may import
  const allFiles = { ...UI_COMPONENTS, ...SECTION_COMPONENTS, ...EXTRA_COMPONENTS, ...projectFiles };
  const src: ProjectFiles = {};
  for (const [p, c] of Object.entries(allFiles)) {
    src[p.replace(/^\//, "")] = c;
  }

  // Sandpack format: /App.tsx + /index.css (or legacy /App.js + /styles.css)
  const appFile = src["App.tsx"] ?? src["App.js"];
  if (appFile) {
    const rawApp = appFile;
    const styles = src["index.css"] ?? src["styles.css"] ?? "body{font-family:system-ui,sans-serif}";
    const exportDefaultMatch =
      rawApp.match(/^export\s+default\s+(?:function|class)\s+(\w+)/m) ||
      rawApp.match(/^export\s+default\s+(\w+)\s*;/m);
    const componentName = exportDefaultMatch?.[1] ?? "App";

    const reactGlobals = `var { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, useLayoutEffect, useId, useTransition, useDeferredValue } = React;`;

    // Collect all JS/JSX/TSX files
    const jsFiles = Object.keys(src)
      .filter((p) => p.match(/\.(jsx?|tsx?)$/) && !p.match(/^(index|main)\./))
      .sort((a, b) => (a.includes("App") ? 1 : 0) - (b.includes("App") ? 1 : 0));

    const strippedCode = jsFiles
      .map((p) => stripModuleSyntax(src[p]))
      .join("\n\n");

    const jsxSource = reactGlobals + "\n" + strippedCode;
    let code: string;
    try { code = transpileTSX(jsxSource); } catch { code = jsxSource; }

    return { code, componentName, styles, title: "App" };
  }

  // Legacy format: src/App.tsx + index.html + src/main.tsx
  const rawHtml = src["index.html"] ?? "";
  const styleMatch = rawHtml.match(/<style>([\s\S]*?)<\/style>/i);
  const styles = styleMatch ? styleMatch[1] : "body{background:#fff;color:#111}";
  const title = rawHtml.match(/<title>(.*?)<\/title>/i)?.[1] ?? "App";

  const tsxFiles = Object.keys(src)
    .filter((p) => p.match(/\.tsx?$/) && !p.match(/\/(main|index)\.(tsx?)$/))
    .sort((a, b) => (a.includes("App") ? 1 : 0) - (b.includes("App") ? 1 : 0));

  const rawApp = src["src/App.tsx"] ?? src[tsxFiles[tsxFiles.length - 1]] ?? "";
  const exportDefaultMatch =
    rawApp.match(/^export\s+default\s+(?:function|class)\s+(\w+)/m) ||
    rawApp.match(/^export\s+default\s+(\w+)\s*;/m);
  const componentName = exportDefaultMatch?.[1] ?? "App";

  const reactGlobals = `var { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, useLayoutEffect, useId, useTransition, useDeferredValue } = React;`;

  const strippedCode = tsxFiles
    .map((p) => stripModuleSyntax(src[p]))
    .join("\n\n");

  const tsxSource = reactGlobals + "\n" + strippedCode;

  let code: string;
  try { code = transpileTSX(tsxSource); } catch { code = tsxSource; }

  return { code, componentName, styles, title };
}

// Used for publish — inlines React so it works with no external deps
export function buildPublishHtml(
  projectFiles: ProjectFiles,
  projectName: string,
  reactScripts: { react: string; reactDom: string }
): string {
  const { code, componentName, styles, title } = buildAppCode(projectFiles);

  const errorBoundary = `class __EB extends React.Component{constructor(p){super(p);this.state={e:null};}static getDerivedStateFromError(e){return{e};}componentDidCatch(e,i){__reportErr('Render error: '+e.message+'\\n'+(e.stack||''));}render(){if(this.state.e)return null;return this.props.children;}}`;
  const renderCall = `${errorBoundary}\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(__EB,null,React.createElement(${componentName},null)));`;
  const fullCode = (LUCIDE_STUB + "\n" + code + "\n" + renderCall).replace(/<\/script>/gi, "<\\/script>");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title || projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${styles}</style>
</head>
<body>
  <div id="root"><div style="display:flex;align-items:center;justify-content:center;height:100vh;font:16px/1 -apple-system,sans-serif;color:#71717a">Loading…</div></div>
  <!-- errors handled silently -->
  <script>${reactScripts.react}</script>
  <script>${reactScripts.reactDom}</script>
  <script>
    function __reportErr(msg){
      /* silent error handling */
      try{window.parent.postMessage({type:'preview-error',error:msg},'*');}catch(e){}
    }
    window.addEventListener('error',function(e){__reportErr('Runtime error: '+e.message+'\\n\\n'+(e.error&&e.error.stack||''));});
    window.addEventListener('unhandledrejection',function(e){__reportErr('Unhandled rejection: '+(e.reason&&e.reason.message||String(e.reason)));});
    (function(){var _f=window.fetch;window.fetch=function(input,init){var body=init&&init.body;if(body&&typeof FormData!=='undefined'&&body instanceof FormData){var fe=null;body.forEach(function(v){if(v instanceof File)fe=v;});if(fe){return new Promise(function(res){var r=new FileReader();r.onload=function(e){var d=e.target.result;res(new Response(JSON.stringify({url:d,name:fe.name,size:fe.size,type:fe.type}),{status:200,headers:{'Content-Type':'application/json'}}));};r.readAsDataURL(fe);});}}return _f.apply(window,arguments);};})();
    ${fullCode}
  </script>
</body>
</html>`;
}

function editButton(projectId?: string): string {
  if (!projectId) return "";
  return `<a id="__tc_edit" href="https://thatcode.dev/projects/${projectId}" target="_blank" rel="noopener"
    style="position:fixed;bottom:16px;left:16px;z-index:99999;display:flex;align-items:center;gap:5px;background:#fff;border:1px solid #ececf1;border-radius:999px;padding:6px 12px 6px 8px;font-family:-apple-system,sans-serif;font-size:11px;font-weight:600;color:#6a1ff7;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:opacity .15s;opacity:0.7"
    onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
    ✏️ Edit
  </a>`;
}

function thatcodeBadge(hideBadge: boolean): string {
  if (hideBadge) return "";
  return `
  <a id="__tc_badge" href="https://thatcode.dev" target="_blank" rel="noopener"
    title="Built with ThatCode — press T to visit"
    style="position:fixed;bottom:16px;right:16px;z-index:99999;display:flex;align-items:center;gap:6px;background:rgba(10,10,15,0.85);backdrop-filter:blur(8px);border:1px solid rgba(168,85,247,0.35);border-radius:999px;padding:5px 11px 5px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:600;color:#d8b4fe;text-decoration:none;box-shadow:0 2px 12px rgba(0,0,0,0.4);transition:opacity .15s">
    <svg width="14" height="14" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="url(#bg)"/><path d="M14 16L22 24L14 32" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 30L34 30" stroke="white" stroke-width="3" stroke-linecap="round"/><defs><linearGradient id="bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs></svg>
    Built with ThatCode
  </a>
  <script>
    document.addEventListener('keydown', function(e) {
      if (e.key === 't' || e.key === 'T') {
        var badge = document.getElementById('__tc_badge');
        if (badge && e.target === document.body) { window.open('https://thatcode.dev', '_blank'); }
      }
    });
  </script>`;
}

function storagePolyfill(slug: string): string {
  // tcSave/tcLoad: synced key-value store for published apps.
  // Falls back to localStorage when offline.
  return `(function(){
  var _slug='${slug}';
  var _base='';
  window.tcSave=function(key,value){
    try{localStorage.setItem('tc_'+_slug+'_'+key,JSON.stringify(value));}catch(e){}
    if(!_slug)return Promise.resolve();
    return fetch(_base+'/api/app-data/'+_slug,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:key,value:value})}).catch(function(){});
  };
  window.tcLoad=function(key,fallback){
    if(!_slug)return Promise.resolve(fallback??null);
    return fetch(_base+'/api/app-data/'+_slug+'?key='+encodeURIComponent(key)).then(function(r){return r.json();}).then(function(d){
      if(d.value!==null&&d.value!==undefined)return d.value;
      try{var lv=localStorage.getItem('tc_'+_slug+'_'+key);if(lv!==null)return JSON.parse(lv);}catch(e){}
      return fallback??null;
    }).catch(function(){
      try{var lv=localStorage.getItem('tc_'+_slug+'_'+key);if(lv!==null)return JSON.parse(lv);}catch(e){}
      return fallback??null;
    });
  };
})();`;
}

// Used for local export download — uses CDN (needs internet)
export function buildStandaloneHtml(
  projectFiles: ProjectFiles,
  projectName: string,
  projectId?: string,
  hideBadge = false,
  publishSlug?: string,
  seoMeta?: { title?: string; description?: string; keywords?: string; ogImage?: string }
): string {
  const { code, componentName, styles, title } = buildAppCode(projectFiles);

  const errorBoundary = `class __EB extends React.Component{constructor(p){super(p);this.state={e:null};}static getDerivedStateFromError(e){return{e};}componentDidCatch(e,i){console.error('App error:',e);showErr('Render error: '+e.message+'\\n'+(e.stack||''));}render(){if(this.state.e){return React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#fff',color:'#333',fontFamily:'system-ui',flexDirection:'column',gap:16,padding:40}},React.createElement('div',{style:{fontSize:40}},'⚠️'),React.createElement('h2',{style:{margin:0}},'Something went wrong'),React.createElement('p',{style:{color:'#666',textAlign:'center'}},'Open browser console (F12) for details.'),React.createElement('a',{href:'https://thatcode.dev',style:{color:'#7c3aed',textDecoration:'none',fontWeight:600}},'✏️ Edit this site'));}return this.props.children;}}`;
  const renderCall = `${errorBoundary}\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(__EB,null,React.createElement(${componentName},null)));`;
  const fullCode = (LUCIDE_STUB + "\n" + code + "\n" + renderCall).replace(/<\/script>/gi, "<\\/script>");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${seoMeta?.title || title || projectName}</title>
  ${seoMeta?.description ? `<meta name="description" content="${seoMeta.description}">` : ''}
  ${seoMeta?.keywords ? `<meta name="keywords" content="${seoMeta.keywords}">` : ''}
  <meta property="og:title" content="${seoMeta?.title || title || projectName}">
  ${seoMeta?.description ? `<meta property="og:description" content="${seoMeta.description}">` : ''}
  ${seoMeta?.ogImage ? `<meta property="og:image" content="${seoMeta.ogImage}">` : ''}
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoMeta?.title || title || projectName}">
  ${seoMeta?.description ? `<meta name="twitter:description" content="${seoMeta.description}">` : ''}
  ${seoMeta?.ogImage ? `<meta name="twitter:image" content="${seoMeta.ogImage}">` : ''}
  ${publishSlug ? `<link rel="canonical" href="https://thatcode.dev/app/${publishSlug}">` : ''}
  <script>
(function() {
  try {
    var data = { projectId: '${projectId || ''}', slug: '${publishSlug || ''}', ref: document.referrer, ua: navigator.userAgent.slice(0, 100), ts: Date.now() };
    fetch('https://thatcode.dev/api/analytics/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), keepalive: true }).catch(function() {});
  } catch(e) {}
})();
</script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${styles}</style>
</head>
<body>
  <div id="root"><div style="display:flex;align-items:center;justify-content:center;height:100vh;font:16px/1 -apple-system,sans-serif;color:#71717a">Loading…</div></div>
  <!-- errors handled silently -->
  <script>
    function showErr(msg){/* silent error handling */try{window.parent.postMessage({type:'preview-error',error:msg},'*');}catch(e){}}
    window.addEventListener('error',function(e){showErr('Runtime error: '+e.message+'\\n\\n'+(e.error&&e.error.stack||''));});
    window.addEventListener('unhandledrejection',function(e){showErr('Promise error: '+(e.reason&&e.reason.message||String(e.reason)));});
    setTimeout(function(){
      if(typeof React==='undefined'){showErr('React failed to load from CDN.\\nCheck your internet connection or try again.');}
      else if(document.getElementById('root').children.length===0||document.getElementById('root').textContent==='Loading…'){showErr('React loaded but app did not mount.\\nReact: '+typeof React+'\\nReactDOM: '+typeof ReactDOM);}
    },8000);
  </script>
  <script src="${REACT_CDN}" onerror="showErr('Failed to load React from CDN: ${REACT_CDN}')"></script>
  <script src="${REACT_DOM_CDN}" onerror="showErr('Failed to load ReactDOM from CDN: ${REACT_DOM_CDN}')"></script>
  <script>
    // Cross-device storage
    ${publishSlug ? storagePolyfill(publishSlug) : "window.tcSave=function(){return Promise.resolve()};window.tcLoad=function(k,fb){return Promise.resolve(fb??null)};"}
    // Polyfill: intercept file uploads — convert to base64 data URL since there's no backend
    (function(){
      var _fetch = window.fetch;
      window.fetch = function(input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var body = init && init.body;
        // Detect multipart/FormData upload requests
        if (body && typeof FormData !== 'undefined' && body instanceof FormData) {
          var fileEntry = null;
          body.forEach(function(val, key) { if (val instanceof File) fileEntry = val; });
          if (fileEntry) {
            return new Promise(function(resolve) {
              var reader = new FileReader();
              reader.onload = function(e) {
                var dataUrl = e.target.result;
                var filename = fileEntry.name;
                var mockBody = JSON.stringify({ url: dataUrl, name: filename, size: fileEntry.size, type: fileEntry.type });
                resolve(new Response(mockBody, { status: 200, headers: { 'Content-Type': 'application/json', 'x-upload-polyfill': '1' } }));
              };
              reader.readAsDataURL(fileEntry);
            });
          }
        }
        return _fetch.apply(window, arguments);
      };
    })();
    try {
      ${fullCode}
    } catch(e) {
      showErr('App init error: '+e.message+'\\n\\n'+(e.stack||''));
    }
  </script>
  <script>
    // Analytics beacon — tracks pageviews, clicks, rage-clicks, form submits
    (function(){
      var pid="${projectId||''}";
      if(!pid)return;
      var base='';
      function send(t,el){
        var body=JSON.stringify({projectId:pid,eventType:t,path:location.pathname,element:el||null});
        try{navigator.sendBeacon(base+'/api/events',new Blob([body],{type:'application/json'}));}catch(e){}
      }
      send('pageview');
      var clicks={};
      document.addEventListener('click',function(e){
        var t=e.target;
        var label=(t.getAttribute&&t.getAttribute('aria-label'))||t.textContent||t.tagName;
        label=(label||'').trim().slice(0,60);
        var key=label||t.tagName;
        var now=Date.now();
        if(!clicks[key])clicks[key]=[];
        clicks[key]=clicks[key].filter(function(ts){return now-ts<2000;});
        clicks[key].push(now);
        send('click',label);
        if(clicks[key].length>=3){send('ragclick',label);clicks[key]=[];}
      },true);
      document.addEventListener('submit',function(){send('form_submit');},true);
    })();
  </script>
  <script>
    // Visual edit mode — activated by parent via postMessage
    var __visualEdit=false;
    var __overlay=null;
    function __removeOverlay(){if(__overlay){__overlay.remove();__overlay=null;}}
    window.addEventListener('message',function(e){
      if(e.data&&e.data.type==='TC_VISUAL_EDIT'){
        __visualEdit=e.data.enabled;
        document.body.style.cursor=__visualEdit?'crosshair':'';
        __removeOverlay();
      }
    });
    document.addEventListener('mouseover',function(e){
      if(!__visualEdit)return;
      __removeOverlay();
      var el=e.target;
      if(el===document.body||el===document.documentElement)return;
      var r=el.getBoundingClientRect();
      __overlay=document.createElement('div');
      __overlay.style.cssText='position:fixed;pointer-events:none;z-index:99998;outline:2px solid #a855f7;background:rgba(168,85,247,0.08);border-radius:4px;';
      __overlay.style.top=r.top+'px';__overlay.style.left=r.left+'px';
      __overlay.style.width=r.width+'px';__overlay.style.height=r.height+'px';
      document.body.appendChild(__overlay);
    },true);
    document.addEventListener('click',function(e){
      if(!__visualEdit)return;
      e.preventDefault();e.stopPropagation();
      var el=e.target;
      var tag=el.tagName.toLowerCase();
      var text=(el.textContent||'').trim().slice(0,120);
      var cls=el.className||'';
      var desc=tag+(text?' containing "'+text+'"':'')+(cls?' (class: '+cls+')':'');
      try{window.parent.postMessage({type:'TC_VISUAL_CLICK',desc:desc,tag:tag,text:text},'*');}catch(err){}
    },true);
  </script>
  ${!hideBadge ? `<!-- Share widget - only on free tier -->
  <div id="tc-share" style="position:fixed;bottom:16px;left:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-start;">
    <button onclick="navigator.share ? navigator.share({title:document.title,url:location.href}) : navigator.clipboard.writeText(location.href).then(function(){var b=document.getElementById('tc-share-btn');b.textContent='\\u2713 Copied!';setTimeout(function(){b.textContent='Share'},2000)})" id="tc-share-btn" style="background:rgba(0,0,0,0.7);color:#fff;border:none;padding:8px 14px;border-radius:20px;cursor:pointer;font-size:13px;font-weight:600;backdrop-filter:blur(8px);">Share</button>
  </div>` : ''}
  ${thatcodeBadge(hideBadge)}
  ${editButton(projectId)}
</body>
</html>`;
}
