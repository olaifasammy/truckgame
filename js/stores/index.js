import {register} from './registry.js';
import dealership from './dealership.js';
import parts from './parts.js';
import offices from './offices.js';
import premium from './premium.js';
[dealership,parts,offices,premium].forEach(register);
