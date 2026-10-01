' Mawang HR - Desk: 스트림덱 버튼으로 뽀모도로 집중을 시작한다 (창 없이).
' 켜져 있는 출근부 서버에 "집중 시작"을 부탁할 뿐, 파일은 건드리지 않는다.
' 이미 집중 중이면 시계를 되돌리지 않고 남은 시간만 알려 준다.
' 이 파일은 UTF-16으로 저장한다 (UTF-8이면 한글 알림이 깨진다).
Const BASE = "http://localhost:4123"   ' 포트 = desk.config.json 의 port
Set sh = CreateObject("WScript.Shell")

' 서버에 요청을 보내고 답(JSON 글자)을 돌려준다. 서버가 꺼져 있으면 빈 글자.
Function Ask(method, path, body)
  On Error Resume Next
  Dim http : Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.Open method, BASE & path, False
  http.setRequestHeader "Content-Type", "application/json"
  http.Send body
  If Err.Number = 0 Then Ask = http.responseText Else Ask = ""
  On Error GoTo 0
End Function

' JSON 글자에서 값 하나를 꺼낸다. 없으면 빈 글자.
Function Pick(text, pattern)
  Dim re : Set re = New RegExp
  re.Pattern = pattern
  Pick = ""
  If re.Test(text) Then Pick = re.Execute(text)(0).SubMatches(0)
End Function

' 화면 맨 앞에 잠깐 뜨고 저절로 닫히는 알림
Sub Say(msg, seconds)
  sh.Popup msg, seconds, "출근부", 64 + 4096
End Sub

state = Ask("GET", "/api/pomo", "")
If state = "" Then
  Say "출근부가 꺼져 있습니다. 출근부 버튼을 먼저 눌러 주세요.", 4
  WScript.Quit
End If

If Pick(state, """phase"":""(\w+)""") = "focus" Then
  leftMin = Int((CDbl(Pick(state, """endsAt"":(\d+)")) - CDbl(Pick(state, """now"":(\d+)"))) / 60000) + 1
  Say "이미 집중 중입니다. " & leftMin & "분 남았습니다.", 3
  WScript.Quit
End If

reply = Ask("POST", "/api/pomodoro", "{""action"":""start""}")
problem = Pick(reply, """error"":""([^""]*)""")
If reply = "" Then
  Say "출근부가 응답하지 않습니다.", 4
ElseIf problem <> "" Then
  Say problem, 4            ' 예: 근무 중일 때만 시작할 수 있습니다
Else
  Say "집중 시작", 2
End If
