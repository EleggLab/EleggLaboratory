export type TarotReadingType = 'today' | 'love' | 'money' | 'relationship' | 'study';

export interface TarotCardDef {
  id: string;
  nameKo: string;
  nameEn: string;
  imageUrl: string;
  meanings: {
    upright: { keywords: string[]; short: string; long: string };
    reversed: { keywords: string[]; short: string; long: string };
  };
}

// Rider–Waite–Smith major arcana.
// Product decision: major (22) only. Minor arcana are intentionally omitted.
export const TAROT_DECK: TarotCardDef[] = [
  {
    id: 'rws-00-fool',
    nameKo: '바보',
    nameEn: 'The Fool',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
    meanings: {
      upright: {
        keywords: ['시작', '호기심', '모험', '가벼움'],
        short: '새로운 시작이 열립니다. 가볍게 뛰어들되, 안전장치만은 챙기세요.',
        long: '의욕이 먼저 앞서는 흐름입니다. 완벽한 계획보다 작은 행동이 결과를 만듭니다. 다만 “아무 준비 없이”가 아니라 “최소한의 준비로 빠르게”가 포인트예요.',
      },
      reversed: {
        keywords: ['충동', '산만', '실수', '현실 점검'],
        short: '기세가 과하면 실수로 이어집니다. 한 번 더 확인하고 움직이는 편이 안전합니다.',
        long: '하고 싶은 게 많아도 지금은 우선순위가 필요합니다. 급하게 뛰어들기보다, 일정/돈/약속처럼 깨지면 큰 손해가 되는 부분부터 정리하세요.',
      },
    },
  },
  {
    id: 'rws-01-magician',
    nameKo: '마법사',
    nameEn: 'The Magician',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
    meanings: {
      upright: {
        keywords: ['집중', '기술', '설득', '주도권'],
        short: '내가 가진 재료로 “당장” 만들어낼 수 있습니다. 말과 실행이 일치할수록 강해집니다.',
        long: '자원은 이미 손에 있습니다. 중요한 건 집중력과 순서입니다. 오늘은 “한 번에 하나”를 끝까지 밀어붙이는 날로 잡아보세요.',
      },
      reversed: {
        keywords: ['과장', '허세', '미루기', '분산'],
        short: '말은 많은데 결과가 안 나기 쉬운 흐름입니다. 범위를 줄여 실물을 만들면 반전됩니다.',
        long: '능력 부족이 아니라 에너지 분산 문제일 때가 많습니다. 보여주기보다 “작동하는 결과물” 1개가 필요합니다. 짧은 데드라인을 설정해 보세요.',
      },
    },
  },
  {
    id: 'rws-02-high-priestess',
    nameKo: '여사제',
    nameEn: 'The High Priestess',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg',
    meanings: {
      upright: {
        keywords: ['직감', '관찰', '비밀', '내면'],
        short: '겉보다 속이 중요한 날입니다. 결론을 서두르지 말고 한 번 더 관찰하세요.',
        long: '지금은 정보가 완전히 드러나지 않았을 수 있습니다. 조용히 파악하고, 확신이 들 때 움직이면 실수가 줄어듭니다. “말을 줄이고 기록을 늘리기”가 도움됩니다.',
      },
      reversed: {
        keywords: ['오해', '불안', '정보 부족', '단정'],
        short: '알지 못한 채 단정하면 틀릴 가능성이 큽니다. 확인 질문이 필요합니다.',
        long: '불안이 상상력을 자극할 수 있습니다. 사실과 추측을 분리하고, 확인 가능한 근거부터 모아보세요. 답이 안 나오면 “보류”도 실력입니다.',
      },
    },
  },
  {
    id: 'rws-03-empress',
    nameKo: '여황제',
    nameEn: 'The Empress',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg',
    meanings: {
      upright: {
        keywords: ['풍요', '돌봄', '성장', '관계'],
        short: '돌보고 키울수록 커집니다. 관계와 환경을 “좋아지게” 만드는 날입니다.',
        long: '성과를 내기 위해서라도 컨디션과 환경을 챙기는 편이 효율적입니다. 지금은 속도보다 “잘 자라는 구조”가 중요합니다.',
      },
      reversed: {
        keywords: ['과보호', '나태', '과소비', '지침'],
        short: '지나친 편안함이 흐름을 무겁게 만들 수 있습니다. 가볍게 정돈부터.',
        long: '돌봄이 부담으로 변하는 순간이 있습니다. 줄일 것(약속/소비/일정)을 줄여야 다시 풍요가 돌아옵니다. “가벼운 절제”가 포인트입니다.',
      },
    },
  },
  {
    id: 'rws-04-emperor',
    nameKo: '황제',
    nameEn: 'The Emperor',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg',
    meanings: {
      upright: {
        keywords: ['구조', '규칙', '책임', '결단'],
        short: '규칙을 세우면 편해집니다. 오늘은 “정리하고 결정하는 날”입니다.',
        long: '감정적으로 흔들리기보다, 기준과 구조를 잡는 게 유리합니다. 계약/일정/역할 분담처럼 딱딱한 것들이 오히려 당신을 보호합니다.',
      },
      reversed: {
        keywords: ['고집', '통제', '경직', '충돌'],
        short: '통제가 지나치면 충돌이 생깁니다. 유연한 협상 여지를 남겨보세요.',
        long: '원칙이 중요하지만, 상대의 현실도 고려해야 합니다. “내가 옳다”보다 “어떻게 하면 유지되는가”로 관점을 바꾸면 해결이 빨라집니다.',
      },
    },
  },
  {
    id: 'rws-05-hierophant',
    nameKo: '교황',
    nameEn: 'The Hierophant',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg',
    meanings: {
      upright: {
        keywords: ['전통', '학습', '조언', '신뢰'],
        short: '검증된 방식이 힘을 발휘합니다. 선배/멘토/규칙을 활용하세요.',
        long: '새로운 길도 좋지만, 오늘은 “안전한 길”이 더 효율적일 수 있습니다. 이미 검증된 체크리스트를 적용하면 속도가 붙습니다.',
      },
      reversed: {
        keywords: ['반항', '형식', '답답함', '자기 기준'],
        short: '규칙이 발목을 잡는 느낌이 듭니다. 필요한 것만 취하고 나머지는 버리세요.',
        long: '형식이 목적을 가리면 답답해집니다. “왜 이 규칙이 필요한가”를 다시 확인하고, 본질에 맞게 최소화하면 길이 열립니다.',
      },
    },
  },
  {
    id: 'rws-06-lovers',
    nameKo: '연인',
    nameEn: 'The Lovers',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/TheLovers.jpg',
    meanings: {
      upright: {
        keywords: ['선택', '연결', '합의', '가치'],
        short: '관계의 선택이 핵심입니다. 솔직한 합의가 흐름을 바꿉니다.',
        long: '감정보다 가치의 정렬이 중요합니다. 관계든 일의 파트너십이든, “같이 가는 방식”을 정하면 에너지가 모입니다.',
      },
      reversed: {
        keywords: ['갈등', '유혹', '불일치', '회피'],
        short: '좋아도 맞지 않을 수 있습니다. 회피보다 대화가 낫습니다.',
        long: '선택을 미루면 더 큰 비용이 생길 수 있습니다. 지금은 “어느 쪽이 나를 더 살리는가”를 기준으로 정리하는 편이 안전합니다.',
      },
    },
  },
  {
    id: 'rws-07-chariot',
    nameKo: '전차',
    nameEn: 'The Chariot',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
    meanings: {
      upright: {
        keywords: ['돌파', '속도', '승부', '통제'],
        short: '밀어붙이면 뚫립니다. 다만 방향이 흔들리면 힘이 새요.',
        long: '강한 추진력이 살아납니다. 목표를 하나로 좁히고, 방해 요소를 줄이면 성과가 큽니다. “속도=정확한 방향”일 때 가장 좋습니다.',
      },
      reversed: {
        keywords: ['과속', '충돌', '방향 상실', '피로'],
        short: '속도를 줄여야 이깁니다. 무리하면 오히려 밀릴 수 있습니다.',
        long: '지금은 힘이 부족한 게 아니라, 과속으로 균형이 깨질 위험이 있습니다. 일정/수면/관계를 한 번에 챙기려 하지 말고, 우선순위를 정하세요.',
      },
    },
  },
  {
    id: 'rws-08-strength',
    nameKo: '힘',
    nameEn: 'Strength',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
    meanings: {
      upright: {
        keywords: ['인내', '용기', '부드러운 통제', '회복'],
        short: '강하게 누르기보다, 부드럽게 길들이면 됩니다.',
        long: '지금 필요한 건 “힘의 양”보다 “힘의 방식”입니다. 감정을 다루고, 루틴으로 버티면 결국 이기는 흐름입니다.',
      },
      reversed: {
        keywords: ['지침', '예민', '자기비난', '불안정'],
        short: '자기 자신에게 너무 가혹할 수 있습니다. 회복이 먼저입니다.',
        long: '컨디션이 흔들리면 판단도 흔들립니다. 오늘은 과제보다 회복에 우선순위를 두세요. 작은 성공을 쌓으면 다시 힘이 돌아옵니다.',
      },
    },
  },
  {
    id: 'rws-09-hermit',
    nameKo: '은둔자',
    nameEn: 'The Hermit',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg',
    meanings: {
      upright: {
        keywords: ['정리', '독립', '탐구', '거리두기'],
        short: '혼자 정리할 시간이 필요합니다. 조용히 계획을 다듬는 날.',
        long: '외부 자극을 줄이면 핵심이 보입니다. 오늘은 “하지 말 것”을 정하면 절반은 성공입니다. 기록과 점검이 큰 도움이 됩니다.',
      },
      reversed: {
        keywords: ['고립', '회피', '정체', '외로움'],
        short: '혼자 버티다 지칠 수 있습니다. 도움을 요청해도 됩니다.',
        long: '거리두기는 필요하지만, 단절은 위험합니다. 믿을 만한 한 사람에게 상황을 공유하고, 작은 피드백을 받으면 정체가 풀립니다.',
      },
    },
  },
  {
    id: 'rws-10-wheel',
    nameKo: '운명의 수레바퀴',
    nameEn: 'Wheel of Fortune',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg',
    meanings: {
      upright: {
        keywords: ['전환', '기회', '흐름', '타이밍'],
        short: '흐름이 바뀝니다. 타이밍을 잡으면 기회가 커집니다.',
        long: '오늘은 “잘 되는 흐름”에 올라타기 좋은 날입니다. 다만 욕심내서 확장하기보다, 한 번 더 확인하고 단계적으로 키우세요.',
      },
      reversed: {
        keywords: ['변덕', '지연', '타이밍 미스', '재정비'],
        short: '흐름이 매끄럽지 않습니다. 조급함을 줄이고 재정비가 필요합니다.',
        long: '원래는 운이 도는 날인데, 무리한 선택이 발목을 잡을 수 있습니다. 오늘은 큰 결정 대신 준비/정리/점검 쪽이 낫습니다.',
      },
    },
  },
  {
    id: 'rws-11-justice',
    nameKo: '정의',
    nameEn: 'Justice',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg',
    meanings: {
      upright: {
        keywords: ['균형', '정리', '판단', '책임'],
        short: '정리와 판단이 필요합니다. 기준을 세우면 마음이 편해져요.',
        long: '감정적으로 흔들리기보다, 사실과 기준을 세우는 날입니다. 계약/정산/약속을 정리하면 분쟁이 줄어듭니다.',
      },
      reversed: {
        keywords: ['불균형', '핑계', '편향', '회피'],
        short: '내가 보고 싶은 것만 보지 않는지 점검하세요. 한 번 더 균형을 잡아야 합니다.',
        long: '불리한 사실을 피하면 비용이 커집니다. 오늘은 정면 돌파보다 “정리해두기”가 이익입니다. 기록과 합의가 핵심입니다.',
      },
    },
  },
  {
    id: 'rws-12-hanged-man',
    nameKo: '매달린 사람',
    nameEn: 'The Hanged Man',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg',
    meanings: {
      upright: {
        keywords: ['멈춤', '관점 전환', '유예', '성찰'],
        short: '지금은 멈춤이 답일 수 있습니다. 관점을 바꾸면 길이 보여요.',
        long: '억지로 진행하면 손해가 날 수 있습니다. 일단 멈추고 관점을 바꿔보세요. “기다림”이 아니라 “재구성”이 포인트입니다.',
      },
      reversed: {
        keywords: ['지연', '답답함', '버팀', '낭비'],
        short: '멈춤이 길어지면 손해입니다. 작은 결단이 필요합니다.',
        long: '유예가 아니라 회피가 되고 있을 수 있습니다. 완벽한 답을 기다리기보다, 작은 결정을 통해 정보를 얻는 쪽이 낫습니다.',
      },
    },
  },
  {
    id: 'rws-13-death',
    nameKo: '죽음',
    nameEn: 'Death',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg',
    meanings: {
      upright: {
        keywords: ['종료', '정리', '전환', '새 출발'],
        short: '끝내야 시작됩니다. 정리할수록 다음이 빨리 와요.',
        long: '두려운 카드처럼 보이지만, 실제로는 “정리의 힘”을 말합니다. 오래 끌던 것을 끝내면 에너지가 돌아옵니다.',
      },
      reversed: {
        keywords: ['미련', '지연', '질질 끌기', '정체'],
        short: '끝내지 못해 정체됩니다. 손실을 줄이려면 정리가 필요합니다.',
        long: '정리하지 못한 과제가 발목을 잡습니다. 오늘은 완전히 끝내기 어려워도, 최소한 “정리의 첫 단계”를 밟는 게 중요합니다.',
      },
    },
  },
  {
    id: 'rws-14-temperance',
    nameKo: '절제',
    nameEn: 'Temperance',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg',
    meanings: {
      upright: {
        keywords: ['조율', '균형', '중용', '회복'],
        short: '섞고 조율하면 답이 나옵니다. 극단을 피하면 쉬워요.',
        long: '오늘은 “한쪽으로 몰기”보다 조율이 유리합니다. 시간을 나누고, 에너지를 분배하면 유지가 됩니다. 건강/관계/일 모두에 통합니다.',
      },
      reversed: {
        keywords: ['과함', '부조화', '불균형', '피로'],
        short: '균형이 깨지면 흔들립니다. 한 가지를 줄이면 회복이 빨라요.',
        long: '해야 할 게 많아도, 지금은 “줄이는 선택”이 필요합니다. 줄이고 나서 다시 섞으면 결과가 훨씬 좋아집니다.',
      },
    },
  },
  {
    id: 'rws-15-devil',
    nameKo: '악마',
    nameEn: 'The Devil',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg',
    meanings: {
      upright: {
        keywords: ['집착', '유혹', '의존', '과몰입'],
        short: '달콤한 유혹이 강합니다. “선”을 정하면 이깁니다.',
        long: '욕망 자체가 문제는 아니지만, 통제권을 빼앗기면 위험합니다. 돈/관계/습관에서 “내가 정한 규칙”이 필요합니다.',
      },
      reversed: {
        keywords: ['해방', '끊어내기', '정리', '회복'],
        short: '끊어낼 수 있습니다. 작은 결단이 큰 해방으로 이어져요.',
        long: '미련이 줄어드는 흐름입니다. 오늘은 정리하기 좋은 날입니다. 특히 반복적으로 후회하던 패턴을 끊기 좋습니다.',
      },
    },
  },
  {
    id: 'rws-16-tower',
    nameKo: '탑',
    nameEn: 'The Tower',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg',
    meanings: {
      upright: {
        keywords: ['충격', '변화', '깨짐', '리셋'],
        short: '갑작스런 변화가 올 수 있습니다. 숨기지 말고 정리하면 빨라요.',
        long: '기반이 약한 부분이 드러날 수 있습니다. 당황하기보다 “지금 드러난 게 다행”이라는 마음으로 정리하면, 오히려 손실이 줄어듭니다.',
      },
      reversed: {
        keywords: ['지연된 붕괴', '회피', '불안', '정비'],
        short: '문제가 커지기 전에 손보는 편이 낫습니다. 작은 수리가 큰 리셋을 막아요.',
        long: '피하고 있던 이슈가 있다면 오늘은 최소한 점검이라도 해두세요. 한 번에 바꾸기보다, 위험 요소를 분리하는 게 핵심입니다.',
      },
    },
  },
  {
    id: 'rws-17-star',
    nameKo: '별',
    nameEn: 'The Star',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg',
    meanings: {
      upright: {
        keywords: ['희망', '회복', '영감', '방향'],
        short: '회복이 시작됩니다. 방향만 잃지 않으면 잘 풀려요.',
        long: '큰 행운이라기보다 “좋아지는 기류”입니다. 조급해하지 말고, 꾸준히 가면 결과가 옵니다. 작은 루틴이 큰 희망으로 바뀝니다.',
      },
      reversed: {
        keywords: ['의심', '흐림', '방향 상실', '지침'],
        short: '희망이 흐려질 수 있습니다. 스스로를 너무 깎아내리지 마세요.',
        long: '원래의 목표를 잃었을 가능성이 있습니다. 오늘은 목표를 새로 세우기보다, “왜 시작했는지”를 다시 확인하는 쪽이 도움이 됩니다.',
      },
    },
  },
  {
    id: 'rws-18-moon',
    nameKo: '달',
    nameEn: 'The Moon',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg',
    meanings: {
      upright: {
        keywords: ['불확실', '감정', '꿈', '착각'],
        short: '명확하지 않을 수 있습니다. 확인 전에는 단정하지 마세요.',
        long: '감정이 커질수록 판단은 흐려질 수 있습니다. 오늘은 “사실 확인”을 늘리고, “추측”을 줄이는 게 이익입니다. 천천히 가도 됩니다.',
      },
      reversed: {
        keywords: ['드러남', '해소', '정리', '현실 감각'],
        short: '헷갈림이 줄어들고, 사실이 드러납니다. 정리하기 좋아요.',
        long: '불확실성이 걷히는 흐름입니다. 오늘은 이야기보다 “정리된 문장/증거”가 힘이 됩니다. 오해가 풀리기 쉽습니다.',
      },
    },
  },
  {
    id: 'rws-19-sun',
    nameKo: '태양',
    nameEn: 'The Sun',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
    meanings: {
      upright: {
        keywords: ['성공', '명확', '자신감', '즐거움'],
        short: '명확해지고 잘 풀립니다. 자신감을 내도 됩니다.',
        long: '오늘은 결과가 보이기 쉬운 날입니다. 가시화(공개/발표/정리)를 하면 더 좋아집니다. 기쁨을 나눌수록 흐름이 커져요.',
      },
      reversed: {
        keywords: ['과열', '자만', '피로', '과도'],
        short: '좋은 흐름이지만 과열되면 피로가 옵니다. 페이스 조절이 필요합니다.',
        long: '자신감이 지나치면 실수가 나옵니다. 오늘은 “잘 되는 만큼 쉬기”를 같이 넣어야 오래 갑니다. 하루 루틴의 균형이 포인트입니다.',
      },
    },
  },
  {
    id: 'rws-20-judgement',
    nameKo: '심판',
    nameEn: 'Judgement',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg',
    meanings: {
      upright: {
        keywords: ['부름', '재평가', '결정', '정리'],
        short: '결정의 시간이 옵니다. 미뤄온 것을 정리하기 좋습니다.',
        long: '과거의 결과를 바탕으로 새로운 판단을 내릴 때입니다. 오늘은 “정리하고 선언하기”가 유리합니다. 방향이 잡히면 속도가 붙습니다.',
      },
      reversed: {
        keywords: ['미루기', '후회', '자책', '결정 회피'],
        short: '결정 회피가 후회를 만들 수 있습니다. 작은 결단부터 시작하세요.',
        long: '큰 결정을 한 번에 하기 어렵다면, “첫 단계”만 정하세요. 작은 결단이 쌓이면 결국 큰 결정도 쉬워집니다.',
      },
    },
  },
  {
    id: 'rws-21-world',
    nameKo: '세계',
    nameEn: 'The World',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',
    meanings: {
      upright: {
        keywords: ['완성', '마무리', '성과', '확장'],
        short: '마무리와 완성이 보입니다. 끝을 잘 내면 다음이 커져요.',
        long: '긴 과정이 결실을 맺을 수 있습니다. 오늘은 마무리/정리/공개가 유리합니다. “끝낸 기록”이 다음 기회를 불러옵니다.',
      },
      reversed: {
        keywords: ['미완', '마무리 지연', '루프', '정리 필요'],
        short: '거의 다 왔는데 마무리가 부족합니다. 마지막 정리가 핵심입니다.',
        long: '실력이나 운의 문제가 아니라 “마무리 습관”의 문제일 수 있습니다. 끝내는 기준을 세우고, 완성도를 한 번에 올리기보다 단계적으로 마무리하세요.',
      },
    },
  },
];

export function spreadFor(type: TarotReadingType): { count: number; positions: string[] } {
  if (type === 'today') return { count: 1, positions: ['오늘의 키워드'] };
  return { count: 3, positions: ['현재', '흐름/장애물', '조언'] };
}
