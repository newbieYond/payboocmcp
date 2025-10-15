# Claude Desktop에 PaybooCMCP 추가하기

Claude Desktop 앱에 PaybooCMCP MCP 서버를 커스텀 커넥터로 추가하는 방법입니다.

## 📋 목차

1. [준비 사항](#준비-사항)
2. [로컬 MCP 서버 설정](#로컬-mcp-서버-설정)
3. [Claude Desktop 설정](#claude-desktop-설정)
4. [테스트 및 확인](#테스트-및-확인)
5. [문제 해결](#문제-해결)

---

## 준비 사항

### 1. 필수 소프트웨어 설치

- **Node.js 18 이상**: https://nodejs.org
- **Claude Desktop**: https://claude.ai/download
- **Git**: https://git-scm.com/downloads

### 2. 프로젝트 클론

```bash
# GitHub에서 클론
git clone https://github.com/newbieYond/payboocmcp.git
cd payboocmcp

# 또는 이미 로컬에 있다면
cd /Users/bccard/Projects/payboocmcp
```

---

## 로컬 MCP 서버 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 프로젝트 빌드

```bash
npm run build
```

빌드가 성공하면 `dist/` 디렉토리에 컴파일된 파일이 생성됩니다:
```
dist/
├── index.js
├── index.d.ts
├── csv-processor.js
└── csv-processor.d.ts
```

### 3. 절대 경로 확인

현재 프로젝트의 절대 경로를 확인합니다:

```bash
pwd
```

**출력 예시**:
```
/Users/bccard/Projects/payboocmcp
```

이 경로를 복사해두세요! 다음 단계에서 사용합니다.

---

## Claude Desktop 설정

### 1. 설정 파일 위치 찾기

운영체제에 따라 Claude Desktop 설정 파일 위치가 다릅니다:

**macOS**:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```
~/.config/Claude/claude_desktop_config.json
```

### 2. 설정 파일 열기

**macOS/Linux**:
```bash
# VS Code로 열기
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 또는 기본 텍스트 에디터
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**:
```powershell
# 메모장으로 열기
notepad %APPDATA%\Claude\claude_desktop_config.json
```

### 3. MCP 서버 설정 추가

설정 파일에 다음 내용을 추가합니다:

```json
{
  "mcpServers": {
    "payboocmcp": {
      "command": "node",
      "args": [
        "/Users/bccard/Projects/payboocmcp/dist/index.js"
      ],
      "env": {
        "CSV_DATA_DIR": "/Users/bccard/Projects/payboocmcp/data"
      }
    }
  }
}
```

⚠️ **중요**:
- `/Users/bccard/Projects/payboocmcp`를 **실제 프로젝트 경로**로 변경하세요
- Windows의 경우 백슬래시를 이스케이프: `C:\\Users\\...`

### 4. 여러 MCP 서버가 있는 경우

이미 다른 MCP 서버가 있다면 다음과 같이 추가합니다:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "node",
      "args": ["/path/to/existing/server.js"]
    },
    "payboocmcp": {
      "command": "node",
      "args": [
        "/Users/bccard/Projects/payboocmcp/dist/index.js"
      ],
      "env": {
        "CSV_DATA_DIR": "/Users/bccard/Projects/payboocmcp/data"
      }
    }
  }
}
```

### 5. 설정 예시 (완전한 버전)

```json
{
  "mcpServers": {
    "payboocmcp": {
      "command": "node",
      "args": [
        "/Users/bccard/Projects/payboocmcp/dist/index.js"
      ],
      "env": {
        "CSV_DATA_DIR": "/Users/bccard/Projects/payboocmcp/data"
      },
      "disabled": false
    }
  },
  "globalShortcut": "CommandOrControl+Shift+Space"
}
```

---

## Claude Desktop 재시작

### 1. Claude Desktop 완전히 종료

**macOS**:
- `Cmd + Q`로 완전히 종료
- 또는 메뉴바에서 Claude → Quit Claude

**Windows**:
- Alt + F4 또는 우측 상단 X 버튼
- 작업 관리자에서 프로세스 확인 후 완전 종료

### 2. Claude Desktop 다시 실행

앱을 다시 시작하면 MCP 서버가 자동으로 로드됩니다.

---

## 테스트 및 확인

### 1. MCP 서버 로드 확인

Claude Desktop을 열고 새 대화를 시작합니다.

### 2. 사용 가능한 도구 확인

Claude에게 다음과 같이 질문합니다:

```
어떤 도구들을 사용할 수 있나요?
```

또는

```
payboocmcp 도구가 있나요?
```

정상적으로 로드되었다면 다음 도구들이 표시됩니다:
- `get_urls_from_csv`
- `list_csv_files`
- `get_all_urls`

### 3. 실제 사용 테스트

#### 테스트 1: CSV 파일 목록 조회

```
CSV 파일 목록을 보여줘
```

**예상 응답**:
```
사용 가능한 CSV 파일:
- example-links.csv
- sample-urls.csv
```

#### 테스트 2: URL 추출

```
example-links.csv 파일에서 URL을 추출해줘
```

**예상 응답**:
```
example-links.csv에서 총 8개의 URL을 찾았습니다.

카테고리별 URL:
- Documentation: 2개
- MCP: 2개
- Tools: 2개
...
```

#### 테스트 3: 모든 URL 조회

```
모든 CSV 파일에서 URL을 가져와줘
```

---

## 고급 설정

### 1. 사용자 정의 CSV 디렉토리

다른 위치의 CSV 파일을 사용하려면:

```json
{
  "mcpServers": {
    "payboocmcp": {
      "command": "node",
      "args": [
        "/Users/bccard/Projects/payboocmcp/dist/index.js"
      ],
      "env": {
        "CSV_DATA_DIR": "/Users/bccard/Documents/my-csv-files"
      }
    }
  }
}
```

### 2. 디버그 모드 활성화

문제 해결을 위해 디버그 로그를 활성화하려면:

```json
{
  "mcpServers": {
    "payboocmcp": {
      "command": "node",
      "args": [
        "/Users/bccard/Projects/payboocmcp/dist/index.js"
      ],
      "env": {
        "CSV_DATA_DIR": "/Users/bccard/Projects/payboocmcp/data",
        "DEBUG": "true"
      }
    }
  }
}
```

### 3. 여러 인스턴스 실행

서로 다른 CSV 디렉토리로 여러 인스턴스를 실행할 수 있습니다:

```json
{
  "mcpServers": {
    "payboocmcp-work": {
      "command": "node",
      "args": ["/path/to/payboocmcp/dist/index.js"],
      "env": {
        "CSV_DATA_DIR": "/Users/username/work-bookmarks"
      }
    },
    "payboocmcp-personal": {
      "command": "node",
      "args": ["/path/to/payboocmcp/dist/index.js"],
      "env": {
        "CSV_DATA_DIR": "/Users/username/personal-bookmarks"
      }
    }
  }
}
```

---

## 문제 해결

### 문제 1: MCP 서버가 로드되지 않음

**증상**: Claude에서 도구를 찾을 수 없음

**해결 방법**:

1. **빌드 확인**:
   ```bash
   cd /Users/bccard/Projects/payboocmcp
   npm run build
   ls dist/index.js  # 파일 존재 확인
   ```

2. **경로 확인**:
   ```bash
   # 절대 경로 확인
   pwd

   # 설정 파일의 경로와 일치하는지 확인
   ```

3. **Node.js 버전 확인**:
   ```bash
   node --version  # v18.0.0 이상이어야 함
   ```

4. **설정 파일 문법 확인**:
   - JSON 형식이 올바른지 확인
   - 쉼표, 중괄호 누락 확인
   - JSON 검증기 사용: https://jsonlint.com

### 문제 2: "CSV 파일을 찾을 수 없음" 에러

**증상**: CSV 파일을 읽을 수 없다는 에러

**해결 방법**:

1. **CSV 디렉토리 확인**:
   ```bash
   ls /Users/bccard/Projects/payboocmcp/data
   ```

2. **환경 변수 확인**:
   ```json
   {
     "env": {
       "CSV_DATA_DIR": "/Users/bccard/Projects/payboocmcp/data"
     }
   }
   ```

3. **권한 확인**:
   ```bash
   # 읽기 권한 확인
   ls -la /Users/bccard/Projects/payboocmcp/data
   ```

### 문제 3: Claude Desktop이 충돌하거나 느림

**해결 방법**:

1. **MCP 서버 일시 비활성화**:
   ```json
   {
     "mcpServers": {
       "payboocmcp": {
         "disabled": true,
         ...
       }
     }
   }
   ```

2. **로그 확인**:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

3. **Claude Desktop 재설치**

### 문제 4: Windows에서 경로 문제

**해결 방법**:

백슬래시를 슬래시로 변경하거나 이스케이프:

```json
{
  "mcpServers": {
    "payboocmcp": {
      "command": "node",
      "args": [
        "C:/Users/username/Projects/payboocmcp/dist/index.js"
      ],
      "env": {
        "CSV_DATA_DIR": "C:/Users/username/Projects/payboocmcp/data"
      }
    }
  }
}
```

또는:

```json
{
  "args": [
    "C:\\Users\\username\\Projects\\payboocmcp\\dist\\index.js"
  ]
}
```

---

## 설정 검증 체크리스트

설정하기 전에 다음을 확인하세요:

- [ ] Node.js 18 이상 설치됨
- [ ] 프로젝트 클론 완료
- [ ] `npm install` 실행 완료
- [ ] `npm run build` 실행 완료
- [ ] `dist/index.js` 파일 존재 확인
- [ ] `data/` 디렉토리에 CSV 파일 존재
- [ ] 절대 경로 확인 완료
- [ ] 설정 파일 위치 확인
- [ ] JSON 형식 올바름
- [ ] Claude Desktop 완전히 재시작

---

## 유용한 명령어

### 빠른 테스트

```bash
# MCP 서버 직접 실행 (터미널에서)
cd /Users/bccard/Projects/payboocmcp
node dist/index.js
# Ctrl+C로 종료
```

### 설정 파일 백업

```bash
# macOS
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json \
   ~/claude_desktop_config.backup.json
```

### 로그 확인

```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp*.log
```

---

## 다음 단계

설정이 완료되면:

1. **CSV 파일 추가**: `data/` 디렉토리에 자신만의 CSV 추가
2. **Claude와 대화**: "CSV 파일에서 URL을 찾아줘"
3. **자동화**: Claude에게 정기적인 작업 요청
4. **통합**: 다른 MCP 서버와 함께 사용

---

## 추가 리소스

- **GitHub Repository**: https://github.com/newbieYond/payboocmcp
- **Web API 문서**: https://payboocmcp.vercel.app/
- **활용 가이드**: [USE_CASES.md](USE_CASES.md)
- **MCP 공식 문서**: https://spec.modelcontextprotocol.io/

---

## 자주 묻는 질문 (FAQ)

### Q1: Web API와 MCP 서버의 차이는?

**Web API**:
- HTTP로 접근
- 브라우저/cURL/Postman에서 사용
- 어디서나 접근 가능

**MCP 서버 (Claude Desktop)**:
- stdio로 접근
- Claude Desktop에서만 사용
- 로컬에서 실행

### Q2: 둘 다 사용할 수 있나요?

네! 이 프로젝트는 두 가지 모두 지원합니다:
- Web API: Vercel에 배포
- MCP 서버: 로컬에서 Claude Desktop과 함께

### Q3: CSV 파일을 어떻게 업데이트하나요?

`data/` 디렉토리의 CSV 파일을 편집하면 자동으로 반영됩니다.
Claude Desktop 재시작은 필요 없습니다.

### Q4: 보안은 어떻게 되나요?

MCP 서버는 로컬에서만 실행되며, 외부 네트워크 접근이 없습니다.
CSV 파일도 로컬에만 저장됩니다.

---

**설정에 문제가 있나요?**

GitHub Issues에 문의하세요: https://github.com/newbieYond/payboocmcp/issues
