/**
 * 주소의 ?키=값 이 목록에 있는 id 일 때만 돌려줍니다.
 * 알림을 눌러 특정 쪽지·학습자로 들어올 때 처음 선택할 항목을 정하는 데 씁니다.
 */
export function queryId(key: string, ids: string[]): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = new URLSearchParams(window.location.search).get(key);
  return value !== null && ids.includes(value) ? value : undefined;
}
