import { lazy, type ComponentType } from "react";
import {
  createBrowserRouter,
  Navigate,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
  type RouteObject,
} from "react-router-dom";
import App from "./App";
import { ROUTES } from "./routes";
import {
  ApiError,
  contentService,
  clearSessionUser,
  homeService,
  messageService,
  notificationService,
  practiceService,
  profileService,
  recordService,
  session,
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

function practiceIdOf(a: LoaderFunctionArgs, fallback: number): number {
  const value = new URL(a.request.url).searchParams.get("practiceId");
  if (value === null) return fallback;
  const practiceId = Number(value);
  if (!Number.isSafeInteger(practiceId) || practiceId < 1) {
    throw new Error("연습 정보를 확인할 수 없습니다.");
  }
  return practiceId;
}

async function loadLearnerData<T>(load: () => Promise<T>): Promise<T> {
  if (!session.token) throw redirect(ROUTES.login);
  if (session.user.role !== "learner") throw redirect(ROUTES.teacher);
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearSessionUser();
      throw redirect(ROUTES.login);
    }
    throw error;
  }
}

async function loadTeacherData<T>(load: () => Promise<T>): Promise<T> {
  if (!session.token) throw redirect(ROUTES.login);
  if (session.user.role !== "teacher") throw redirect(ROUTES.home);
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearSessionUser();
      throw redirect(ROUTES.login);
    }
    if (error instanceof ApiError && error.status === 403) {
      throw redirect(ROUTES.home);
    }
    throw error;
  }
}

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
  {
    path: ROUTES.home,
    element: <Page C={Home} />,
    loader: async () => ({ home: await loadLearnerData(() => homeService.getHome()) }),
  },
  {
    path: ROUTES.areas,
    element: <Page C={Areas} />,
    loader: async () => ({ practices: await loadLearnerData(() => practiceService.getPractices()) }),
  },
  {
    path: ROUTES.unit,
    element: <Page C={Unit} />,
    loader: async (a) => {
      const level = levelOf(a);
      const practiceId = practiceIdOf(a, 1);
      return {
        level,
        practiceId,
        ...(await loadLearnerData(() => contentService.getUnitContent(level, practiceId))),
      };
    },
  },
  {
    path: ROUTES.unitVideo,
    element: <Page C={UnitVideo} />,
    loader: async (a) => {
      const level = levelOf(a);
      const practiceId = practiceIdOf(a, 1);
      return {
        level,
        practiceId,
        ...(await loadLearnerData(() => contentService.getUnitVideoContent(level, practiceId))),
      };
    },
  },
  {
    path: ROUTES.scenario,
    element: <Page C={Scenario} />,
    loader: async (a) => {
      const practiceId = practiceIdOf(a, 2);
      return {
        practiceId,
        scenarios: await loadLearnerData(() => contentService.getScenarios(practiceId)),
      };
    },
  },
  {
    path: ROUTES.emotion,
    element: <Page C={Emotion} />,
    loader: async (a) => {
      const practiceId = practiceIdOf(a, 3);
      return {
        practiceId,
        ...(await loadLearnerData(() => contentService.getEmotionScene(practiceId))),
      };
    },
  },
  {
    path: ROUTES.collection,
    element: <Page C={Collection} />,
    loader: async () => ({
      records: await loadLearnerData(() => recordService.getLearningRecords()),
    }),
  },
  {
    path: ROUTES.talk,
    element: <Page C={Talk} />,
    loader: async () => {
      await loadLearnerData(async () => null);
      return null;
    },
  },
  {
    path: ROUTES.messages,
    element: <Page C={Messages} />,
    loader: async () => ({
      messages: await loadLearnerData(() => messageService.getMyMessages()),
    }),
  },
  { path: ROUTES.help, element: <Page C={ExternalHelp} /> },
  {
    path: ROUTES.profile,
    element: <Page C={Profile} />,
    loader: async () => ({
      profile: await loadLearnerData(() => profileService.getProfile()),
    }),
  },
  {
    path: ROUTES.notifications,
    element: <Page C={Notifications} />,
    loader: async () => ({
      notifications: await loadLearnerData(() => notificationService.getNotifications()),
    }),
  },
  {
    path: ROUTES.teacher,
    element: <Page C={Teacher} />,
    loader: async () => ({
      students: await loadTeacherData(() => teacherService.getStudents()),
    }),
  },
  {
    path: ROUTES.teacherMessages,
    element: <Page C={TeacherMessages} />,
    loader: async () => ({
      messages: await loadTeacherData(() => teacherService.getMessages()),
    }),
  },
  {
    path: ROUTES.teacherSignal,
    element: <Page C={TeacherSignal} />,
    loader: async () => ({
      students: await loadTeacherData(() => teacherService.getSignalStudents()),
    }),
  },
  {
    path: ROUTES.teacherUpload,
    element: <Page C={TeacherUpload} />,
    loader: async () => {
      await loadTeacherData(async () => null);
      return null;
    },
  },
];

export const router = createBrowserRouter([
  {
    element: <App />,
    // 로그인한 사용자 정보(헤더·홈 인사말)를 처음 한 번 불러옵니다.
    loader: async () => {
      // 로그인하지 않은 사용자는 사용자 정보를 요청하지 않음
      if (!session.token) {
        return null;
      }

      try {
        const p = await profileService.getProfile();

        setSessionUser(
          {
            ...session.user,
            nick: p.nick,
          },
          session.token
        );
      } catch (error) {
        console.error("사용자 정보 조회 실패:", error);
      }

      return null;
    },
    children: [
      ...pageRoutes,
      {
        path: "*",
        element: <Navigate to={ROUTES.landing} replace />,
      },
    ],
  },
]);
