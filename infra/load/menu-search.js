import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// FoodStra load test — hammers the public menu/search read path to find the
// capacity ceiling. Run: `k6 run -e BASE_URL=http://localhost:4000 menu-search.js`
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const searchLatency = new Trend('search_latency', true);

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400'],
  },
};

const QUERIES = ['pizza', 'ramen', 'taco', 'sushi', ''];

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const res = http.get(`${BASE_URL}/api/v1/menu/search?q=${q}`);
  searchLatency.add(res.timings.duration);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has body': (r) => r.body.length > 0,
  });
  sleep(Math.random() * 0.5);
}
