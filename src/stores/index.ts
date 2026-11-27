import { register } from './registry';
import dealership from './dealership';
import parts from './parts';

[dealership, parts].forEach(register);
