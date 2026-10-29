import { register } from '../core/router';
import home from './home/index';
import garage from './garage';
import store from './store';
import company from './company';
import rankings from './rankings';
import finance from './finance';
import repair from './repair';
import drivers from './drivers';
import storage from './storage';

[home, garage, company, finance, store, rankings, repair, drivers, storage].forEach(register);
