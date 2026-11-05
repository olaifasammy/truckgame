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
import notifications from './notifications';
import network from './network';
import dispatch from './dispatch';

[home, garage, dispatch, company, network, finance, store, rankings, repair, drivers, storage, notifications].forEach(register);


