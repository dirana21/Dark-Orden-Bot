import { ListVengefulSoulsStandings } from "@/application/vengeful-souls/list-vengeful-souls-standings";
import { SubmitVengefulSoulsScore } from "@/application/vengeful-souls/submit-vengeful-souls-score";
import { D1VengefulSoulsRepository } from "@/infrastructure/vengeful-souls/d1-vengeful-souls-repository";
import { SystemClock } from "@/infrastructure/system/system-services";

const scores = new D1VengefulSoulsRepository();
const clock = new SystemClock();

export const vengefulSoulsUseCases = {
  list: new ListVengefulSoulsStandings(scores),
  submit: new SubmitVengefulSoulsScore(scores, clock),
};
