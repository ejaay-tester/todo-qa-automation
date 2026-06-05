import { Options } from "k6/options"

export const defaultThresholds: Options["thresholds"] = {
  http_req_duration: ["p(95)<500", "p(99)<100"],
  http_req_failed: ["rate<0.01"],
  checks: ["rate>0.99"],
}

export const strictThresholds: Options["thresholds"] = {
  http_req_duration: ["p(95)<200", "p(99)<400"],
  http_req_failed: ["rate<0.001"],
  checks: ["rate>0.999"],
}

export const stressThresholds: Options["thresholds"] = {
  http_req_duration: ["p(95)<2000"],
  http_req_failed: ["rate<0.05"],
  checks: ["rate>0.95"],
}
