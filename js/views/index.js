import {register} from '../core/router.js';
import stub from './stub.js';
import jobs from './jobs.js';
import garage from './garage.js';
import store from './store.js';
import company from './company.js';
[jobs,garage,company,stub('online','online','Online'),store].forEach(register);
