import type { HomeResponse } from "../types";

export const home: HomeResponse = {
  nickname: "친구",
  unreadMessages: 1,
  doneTotal: 4,
  resume: {
    practiceId: 5,
    title: "안전·자기 보호",
    type: "UNIT",
    area: "SAFETY",
    level: 1,
    estMinutes: 10,
    myStatus: "IN_PROGRESS",
  },
};
