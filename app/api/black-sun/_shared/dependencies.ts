import { ListBlackSunStandings } from "@/application/black-sun/list-black-sun-standings";
import { SubmitBlackSunScore } from "@/application/black-sun/submit-black-sun-score";
import { D1BlackSunRepository } from "@/infrastructure/black-sun/d1-black-sun-repository";
import { SystemClock } from "@/infrastructure/system/system-services";

const scores = new D1BlackSunRepository();
const clock = new SystemClock();

export const blackSunUseCases = {
  list: new ListBlackSunStandings(scores),
  submit: new SubmitBlackSunScore(scores, clock),
};
