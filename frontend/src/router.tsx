import { lazy, type ComponentType } from "react";
import {
  createBrowserRouter,
  Navigate,
  useLoaderData,
  type LoaderFunctionArgs,
  type RouteObject,
} from "react-router-dom";
import App from "./App";
import { ROUTES } from "./routes";
import {
  contentService,
  messageService,
  notificationService,
  profileService,
  recordService,
  setSessionUser,
  teacherService,
} from "@/api";

// 화면(페이지)은 라우트별로 코드 분할해서 불러옵니다.
const Landing = lazy(() => import("@/pages/auth/Landing/Landing"));
const Login = lazy(() => import("@/pages/auth/Login/Login"));
const Signup = lazy(() => import("@/pages/auth/Signup/Signup"));
const Terms = lazy(() => import("@/pages/auth/Terms/Terms"));
const Home = lazy(() => import("@/pages/learner/Home/Home"));
const Areas = lazy(() => import("@/pages/learner/Areas/Areas"));
const Unit = lazy(() => import("@/pages/learner/Unit/Unit"));
const UnitVideo = lazy(() => import("@/pages/learner/UnitVideo/UnitVideo"));
const Scenario = lazy(() => import("@/pages/learner/Scenario/Scenario"));
const Emotion = lazy(() => import("@/pages/learner/Emotion/Emotion"));
const Collection = lazy(() => import("@/pages/learner/Collection/Collection"));
const Talk = lazy(() => import("@/pages/learner/Talk/Talk"));
const Messages = lazy(() => import("@/pages/learner/Messages/Messages"));
const ExternalHelp = lazy(() => import("@/pages/learner/ExternalHelp/ExternalHelp"));
const Profile = lazy(() => import("@/pages/learner/Profile/Profile"));
const Notifications = lazy(() => import("@/pages/learner/Notifications/Notifications"));
const Teacher = lazy(() => import("@/pages/teacher/Teacher/Teacher"));
const TeacherMessages = lazy(() => import("@/pages/teacher/TeacherMessages/TeacherMessages"));
const TeacherSignal = lazy(() => import("@/pages/teacher/TeacherSignal/TeacherSignal"));
const TeacherUpload = lazy(() => import("@/pages/teacher/TeacherUpload/TeacherUpload"));

const levelOf = (a: LoaderFunctionArgs) =>
  new URL(a.request.url).searchParams.get("level") ?? undefined;

/**
 * 라우트 로더가 가져온 데이터를 화면(클래스 컴포넌트)의 props 로 넘겨 줍니다.
 * 화면이 뜨기 전에 데이터를 받아 두기 때문에 "빈 화면 → 채워짐" 깜빡임이 없어요.
 */
function Page({ C }: { C: ComponentType<any> }) {
  const data = useLoaderData() as Record<string, unknown> | null;
  return <C {...(data ?? {})} />;
}

/**
 * 화면 ↔ 데이터 연결표. 각 loader 가 부르는 service 를 실제 API 로 바꾸면(src/api/services) 화면은 그대로 동작합니다.
 * 학습 단위 화면(S07/S07-2)은 ?level=aqua|ame|sap|dia 로 보석 단계를 받아요.
 */
const pageRoutes: RouteObject[] = [
  { path: ROUTES.landing, element: <Page C={Landing} /> },
  { path: ROUTES.login, element: <Page C={Login} /> },
  { path: ROUTES.signup, element: <Page C={Signup} /> },
  {
    path: ROUTES.terms,
    element: <Page C={Terms} />,
    loader: async () => ({ docs: await contentService.getTerms() }),
  },
  { path: ROUTES.home, element: <Page C={Home} /> },
  {
    path: ROUTES.areas,
    element: <Page C={Areas} />,
    loader: async () => ({ practices: await contentService.getPractices() }),
  },
  {
    path: ROUTES.unit,
    element: <Page C={Unit} />,
    loader: async (a) => {
      const level = levelOf(a);
      return { level, ...(await contentService.getUnitContent(level)) };
    },
  },
  {
    path: ROUTES.unitVideo,
    element: <Page C={UnitVideo} />,
    loader: async (a) => {
      const level = levelOf(a);
      return { level, ...(await contentService.getUnitVideoContent(level)) };
    },
  },
  {
    path: ROUTES.scenario,
    element: <Page C={Scenario} />,
    loader: async () => ({ scenarios: await contentService.getScenarios() }),
  },
  {
    path: ROUTES.emotion,
    element: <Page C={Emotion} />,
    loader: async () => ({ ...(await contentService.getEmotionScene()) }),
  },
  {
    path: ROUTES.collection,
    element: <Page C={Collection} />,
    loader: async () => ({ records: await recordService.getLearningRecords() }),
  },
  { path: ROUTES.talk, element: <Page C={Talk} /> },
  {
    path: ROUTES.messages,
    element: <Page C={Messages} />,
    loader: async () => ({ messages: await messageService.getMyMessages() }),
  },
  { path: ROUTES.help, element: <Page C={ExternalHelp} /> },
  {
    path: ROUTES.profile,
    element: <Page C={Profile} />,
    loader: async () => ({ profile: await profileService.getProfile() }),
  },
  {
    path: ROUTES.notifications,
    element: <Page C={Notifications} />,
    loader: async () => ({ notifications: await notificationService.getNotifications() }),
  },
  {
    path: ROUTES.teacher,
    element: <Page C={Teacher} />,
    loader: async () => ({ students: await teacherService.getStudents() }),
  },
  {
    path: ROUTES.teacherMessages,
    element: <Page C={TeacherMessages} />,
    loader: async () => ({ messages: await teacherService.getMessages() }),
  },
  {
    path: ROUTES.teacherSignal,
    element: <Page C={TeacherSignal} />,
    loader: async () => ({ students: await teacherService.getSignalStudents() }),
  },
  { path: ROUTES.teacherUpload, element: <Page C={TeacherUpload} /> },
];

export const router = createBrowserRouter([
  {
    element: <App />,
    // 로그인한 사용자 정보(헤더·홈 인사말)를 처음 한 번 불러옵니다.
    loader: async () => {
      const p = await profileService.getProfile();
      setSessionUser({ nick: p.nick, role: "learner" });
      return null;
    },
    children: [...pageRoutes, { path: "*", element: <Navigate to={ROUTES.landing} replace /> }],
  },
]);
