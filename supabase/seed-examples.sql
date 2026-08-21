-- 예시글 시드: 세 게시판(공지사항·Q&A·건의사항)에 각 15개.
-- Supabase 대시보드 → SQL Editor → New query → Run 으로 1회 실행.
-- 다시 실행하면 같은 글이 또 삽입되니 주의(중복 삽입).
--
-- 참고: Q&A·건의사항은 비공개 게시판이라 '관리자와 글쓴이 본인'만 봅니다.
-- 아래 예시는 가상의 학생(student01…15) 이름으로 넣으므로, 관리자로 로그인해야
-- 목록에 보입니다. 공지사항은 모두에게 보입니다.

-- ------------------------------------------------------ 공지사항 (관리자 작성)
insert into public.board_posts
  (category, title, body, author_username, author_name, reply, replied_at, created_at)
select
  'notice',
  (array[
    '수강 안내 및 오리엔테이션','1주차 강의자료 배포','실습실 이용 수칙','중간고사 일정 공지',
    '과제 1 제출 안내','휴강 및 보강 안내','참고 문헌 목록 안내','팀 프로젝트 구성 안내',
    '출석 확인 방법','질의응답 시간 운영','기말고사 범위 공지','성적 이의신청 절차',
    '강의실 변경 안내','실습 평가 기준','종강 및 성적 발표'
  ])[g],
  '<b>수의생화학</b> 수업 관련 <u>' || g || '번째 공지</u>입니다. '
    || '자세한 내용은 강의 중 안내드리며, 궁금한 점은 <b>질문 게시판</b>을 이용해 주세요.',
  'jbnu', 'Jaewon Seol',
  null, null,
  now() - (g * interval '1 day')
from generate_series(1, 15) g;

-- -------------------------------------------------------- Q&A (학생 작성)
-- 3의 배수 글에는 관리자 답변을 함께 넣어 '답변 완료' 상태를 보여 줍니다.
insert into public.board_posts
  (category, title, body, author_username, author_name, reply, replied_at, created_at)
select
  'qa',
  (array[
    '해당과정에서 ATP 수지가 헷갈립니다','TCA 회로 조절 효소 질문','전자전달계 저해제 질문',
    '지방산 β-산화 관련 질문','요소 회로 반응 질문','케톤체 생성 조건 질문','포도당신생합성 경로 질문',
    '글리코겐 분해 조절 질문','펜토스인산경로 역할 질문','아미노산 탈아미노화 질문',
    '인슐린·글루카곤 작용 차이','NADH와 FADH2 차이','산화적 인산화 P/O비 질문',
    '보결분자단 관련 질문','시험 범위 관련 질문'
  ])[g],
  '교수님, <b>' || g || '번</b> 질문입니다. 강의노트 중 <u>이 부분</u>이 이해되지 않아 여쭤봅니다. '
    || 'H<sub>2</sub>O·CO<sub>2</sub> 관련 반응도 함께 설명 부탁드립니다.',
  'student' || g, '학생' || lpad(g::text, 2, '0'),
  case when g % 3 = 0
    then '<b>좋은 질문입니다.</b> 해당 부분은 다음 강의에서 자세히 다루겠습니다. 우선 교재 해당 단원을 참고하세요.'
    else null end,
  case when g % 3 = 0 then now() - (g * interval '20 hours') else null end,
  now() - (g * interval '15 hours')
from generate_series(1, 15) g;

-- --------------------------------------------------- 건의사항 (학생 작성)
insert into public.board_posts
  (category, title, body, author_username, author_name, reply, replied_at, created_at)
select
  'suggestion',
  (array[
    '강의 속도 관련 건의','실습 시간 확대 요청','강의자료 조기 배포 요청','녹화본 제공 요청',
    '과제 마감일 조정 요청','조별 활동 비중 조정','시험 문제 유형 안내 요청','질의응답 시간 확대',
    '판서 글씨 크기 건의','예제 풀이 추가 요청','참고자료 링크 정리 요청','휴식 시간 조정 건의',
    '용어 정리집 제공 요청','실습 조 편성 방식 건의','전반적 수업 만족 및 제안'
  ])[g],
  '안녕하세요, <b>' || g || '번째 건의</b>드립니다. 수업이 전반적으로 <u>매우 유익</u>합니다. '
    || '다만 아래 부분을 조금 개선해 주시면 좋겠습니다. 감사합니다.',
  'student' || g, '학생' || lpad(g::text, 2, '0'),
  null, null,
  now() - (g * interval '10 hours')
from generate_series(1, 15) g;
