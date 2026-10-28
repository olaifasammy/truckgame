import { register } from './registry';
import dealership from './dealership';
import parts from './parts';
import offices from './offices';
import premium from './premium';

[dealership, parts, offices, premium].forEach(register);
