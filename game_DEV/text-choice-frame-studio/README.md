# Text Choice Template

장면과 선택지만 채워 넣는 최소 텍스트 선택형 제작기입니다.

## 포함 기능

- 새 프로젝트: 7장면 기본 템플릿 로드
- 프로젝트 JSON 불러오기 / 내보내기
- 장면 추가, 엔딩 추가, 선택지 편집
- 바로 확인하는 플레이테스트

## 기본 구조

- 도입
- 사건
- 단서
- 압박
- 결정
- 엔딩 A
- 엔딩 B

## JSON 형식

```json
{
  "version": 1,
  "meta": {
    "title": "제목",
    "author": "작성자",
    "start_node_id": "intro"
  },
  "nodes": [
    {
      "id": "intro",
      "kind": "scene",
      "title": "도입",
      "speaker": "",
      "text": "",
      "writer_note": "",
      "next": "incident",
      "choices": []
    }
  ]
}
```

추가 필드는 불러올 때 무시되며, 다시 저장하면 최소 형식으로 정리됩니다.
