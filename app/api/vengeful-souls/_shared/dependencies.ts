import { ListVengefulSoulsStandings } from "@/application/vengeful-souls/list-vengeful-souls-standings";
import { SelectVengefulSoulsRole } from "@/application/vengeful-souls/select-vengeful-souls-role";
import { SubmitVengefulSoulsScore } from "@/application/vengeful-souls/submit-vengeful-souls-score";
import { D1VengefulSoulsRepository } from "@/infrastructure/vengeful-souls/d1-vengeful-souls-repository";
import { SystemClock } from "@/infrastructure/system/system-services";

const scores = new D1VengefulSoulsRepository();
const clock = new SystemClock();

export const vengefulSoulsUseCases = {
  list: new ListVengefulSoulsStandings(scores),
  selectRole: new SelectVengefulSoulsRole(scores),
  submit: new SubmitVengefulSoulsScore(scores, clock),
};
