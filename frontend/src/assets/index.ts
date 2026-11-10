/**
 * 이미지 리소스 모음 — 화면에서 쓰는 모든 이미지를 한 곳에서 import 합니다.
 * 사용: import { img } from '@/assets';  <img src={img.logo} />
 * 파일 위치: src/assets/images/<분류>/<이름>
 */

// areas
import letterBackDefault from "./images/areas/letter-back-default.png";
import letterHelpFlap from "./images/areas/letter-help-flap.png";
import stageBg from "./images/areas/stage-bg.jpg";
import stageGems from "./images/areas/stage-gems.webp";
import letterSafeBack from "./images/areas/letter-safe-back.png";
import letterSafeFlap from "./images/areas/letter-safe-flap.png";
import letterSafeSeal from "./images/areas/letter-safe-seal.png";
import letterHelpBack from "./images/areas/letter-help-back.png";
import letterHelpSeal from "./images/areas/letter-help-seal.png";
import letterEmoBack from "./images/areas/letter-emo-back.png";
import letterEmoFlap from "./images/areas/letter-emo-flap.png";
import letterEmoSeal from "./images/areas/letter-emo-seal.png";
import envHelpBody from "./images/areas/env-help-body.webp";
import envHelpFlap from "./images/areas/env-help-flap.webp";
import envHelpInner from "./images/areas/env-help-inner.webp";
import envSafeBody from "./images/areas/env-safe-body.webp";
import envSafeFlap from "./images/areas/env-safe-flap.webp";
import envSafeInner from "./images/areas/env-safe-inner.webp";
import envEmoBody from "./images/areas/env-emo-body.webp";
import envEmoFlap from "./images/areas/env-emo-flap.webp";
import envEmoInner from "./images/areas/env-emo-inner.webp";

// banners
import bannerAreas from "./images/banners/banner-areas.webp";
import bannerTalk from "./images/banners/banner-talk.webp";
import bannerMessages from "./images/banners/banner-messages.webp";
import bannerUnit from "./images/banners/banner-unit.webp";
import bannerScenario from "./images/banners/banner-scenario.webp";
import bannerNotifications from "./images/banners/banner-notifications.webp";
import bannerHelp from "./images/banners/banner-help.webp";
import bannerEmotion from "./images/banners/banner-emotion.webp";

// brand
import logo from "./images/brand/logo.png";

// units
import unitCard1 from "./images/units/unit-card-1.png";
import unitCard2 from "./images/units/unit-card-2.png";
import unitCard3 from "./images/units/unit-card-3.png";
import unitCard4 from "./images/units/unit-card-4.png";
import unitCard5 from "./images/units/unit-card-5.png";

// scenarios
import scenarioSecret from "./images/scenarios/scenario-secret.png";
import scenarioGroup from "./images/scenarios/scenario-group.png";
import scenarioGift from "./images/scenarios/scenario-gift.png";

// village
import villageBg from "./images/village/village-bg.jpg";
import villageFrame1 from "./images/village/village-frame-1.webp";
import villageFrame2 from "./images/village/village-frame-2.webp";
import villageFrame3 from "./images/village/village-frame-3.webp";
import villageFrame4 from "./images/village/village-frame-4.webp";
import villageFrame5 from "./images/village/village-frame-5.webp";
import villageFrame6 from "./images/village/village-frame-6.webp";
import villageFrame7 from "./images/village/village-frame-7.webp";
import villageFrame8 from "./images/village/village-frame-8.webp";

// emotion
import emotionScene from "./images/emotion/emotion-scene.jpg";

// gems
import gemOpal from "./images/gems/gem-opal.png";
import gemAqua from "./images/gems/gem-aqua.png";
import gemAmethyst from "./images/gems/gem-amethyst.png";
import gemSapphire from "./images/gems/gem-sapphire.png";
import gemDiamond from "./images/gems/gem-diamond.png";

// collection
import collectionScene from "./images/collection/collection-scene.png";

export const img = {
  // areas
  letterBackDefault,
  letterHelpFlap,
  stageBg,
  stageGems,
  letterSafeBack,
  letterSafeFlap,
  letterSafeSeal,
  letterHelpBack,
  letterHelpSeal,
  letterEmoBack,
  letterEmoFlap,
  letterEmoSeal,
  envHelpBody,
  envHelpFlap,
  envHelpInner,
  envSafeBody,
  envSafeFlap,
  envSafeInner,
  envEmoBody,
  envEmoFlap,
  envEmoInner,
  // banners
  bannerAreas,
  villageBg,
  bannerTalk,
  bannerMessages,
  bannerUnit,
  bannerScenario,
  bannerNotifications,
  bannerHelp,
  bannerEmotion,
  // brand
  logo,
  // units
  unitCard1,
  unitCard2,
  unitCard3,
  unitCard4,
  unitCard5,
  // scenarios
  scenarioSecret,
  scenarioGroup,
  scenarioGift,
  // village
  villageFrame1,
  villageFrame2,
  villageFrame3,
  villageFrame4,
  villageFrame5,
  villageFrame6,
  villageFrame7,
  villageFrame8,
  // emotion
  emotionScene,
  // gems
  gemOpal,
  gemAqua,
  gemAmethyst,
  gemSapphire,
  gemDiamond,
  // collection
  collectionScene,
} as const;

export type ImgKey = keyof typeof img;
