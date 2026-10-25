import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/index.css';

import { startMotion } from './motion/engine';
import { boot } from './motion/scenes/boot';
import { core } from './motion/scenes/core';
import { chrome } from './motion/scenes/chrome';
import { arsenal, contact, principles } from './motion/scenes/editorial';
import { lab } from './motion/scenes/lab';
import { manifesto } from './motion/scenes/manifesto';
import { systems } from './motion/scenes/systems';
import { work } from './motion/scenes/work';
import { initArchitecture } from './ui/architecture';
import { initArsenal } from './ui/arsenal';
import { initBuddy } from './ui/buddy';
import { initCopy } from './ui/copy';
import { initActiveSection, initNav } from './ui/nav';

initNav();
initArchitecture();
initActiveSection();
initCopy();
initArsenal();
initBuddy();

// Document order; chrome and the async WebGL core last so their triggers see every pin's spacing.
startMotion([boot, manifesto, work, lab, systems, arsenal, principles, contact, chrome, core]);
