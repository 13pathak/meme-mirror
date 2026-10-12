"""Generate the operator guide and visitor poster. Requires ReportLab (authoring only).

Use the bundled Codex Python runtime when generating these artifacts in Codex.
The application itself does not need Python or ReportLab.
"""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, A3
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Preformatted

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
FONTS = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('MMArial', str(FONTS / 'arial.ttf')))
pdfmetrics.registerFont(TTFont('MMArialBold', str(FONTS / 'arialbd.ttf')))
pdfmetrics.registerFont(TTFont('MMMono', str(FONTS / 'consola.ttf')))
pdfmetrics.registerFontFamily('MMArial', normal='MMArial', bold='MMArialBold', italic='MMArial', boldItalic='MMArialBold')

INK = colors.HexColor('#283022')
MUTED = colors.HexColor('#65705b')
MINT = colors.HexColor('#e0edc8')
YELLOW = colors.HexColor('#f9e89b')
PINK = colors.HexColor('#f1c6cd')
BLUE = colors.HexColor('#c8ddf6')
RULE = colors.HexColor('#d9d9d9')
WIDTH = A4[0] - 96

ST = {
    'title': ParagraphStyle('Title', fontName='MMArialBold', fontSize=26, leading=30, textColor=colors.black, spaceAfter=12),
    'page': ParagraphStyle('Page heading', fontName='MMArialBold', fontSize=23, leading=28, textColor=colors.black, spaceAfter=12),
    'head': ParagraphStyle('Heading', fontName='MMArialBold', fontSize=14, leading=18, textColor=colors.black, spaceBefore=12, spaceAfter=6, keepWithNext=True),
    'body': ParagraphStyle('Body', fontName='MMArial', fontSize=10.5, leading=15, textColor=INK, spaceAfter=7),
    'small': ParagraphStyle('Small', fontName='MMArial', fontSize=9, leading=13, textColor=MUTED, spaceAfter=6),
    'list': ParagraphStyle('List', fontName='MMArial', fontSize=10.5, leading=15, textColor=INK, leftIndent=18, firstLineIndent=-18, spaceAfter=7),
    'code': ParagraphStyle('Code', fontName='MMMono', fontSize=8.8, leading=13, textColor=INK, spaceBefore=5, spaceAfter=10),
    'cell': ParagraphStyle('Cell', fontName='MMArial', fontSize=9.5, leading=13, textColor=INK),
    'th': ParagraphStyle('Header cell', fontName='MMArialBold', fontSize=9.5, leading=13, textColor=colors.white),
}

def p(text, style='body'):
    return Paragraph(text, ST[style])

def heading(text):
    return p(text, 'head')

def numbered(items):
    return [p(f'<b>{i}.</b>  {text}', 'list') for i, text in enumerate(items, 1)]

def bullets(items):
    return [p('&#8226;  ' + text, 'list') for text in items]

def table(headers, rows, widths, padding=8):
    data = [[p(escape(x), 'th') for x in headers]] + [[p(x, 'cell') for x in row] for row in rows]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#354052')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f4f6f8')]),
        ('GRID', (0,0), (-1,-1), .5, RULE),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ('TOPPADDING', (0,0), (-1,-1), padding),
        ('BOTTOMPADDING', (0,0), (-1,-1), padding),
    ]))
    return t

def footer(c, doc):
    c.saveState()
    c.setFont('MMArial', 8)
    c.setFillColor(MUTED)
    c.drawString(48, A4[1]-28, 'MEME MIRROR  |  SETUP AND OPERATOR GUIDE')
    c.setStrokeColor(RULE)
    c.line(48, 43, A4[0]-48, 43)
    c.drawString(48, 29, 'PTM 14 October 2026  |  Prepared 12 October 2026')
    c.drawRightString(A4[0]-48, 29, f'{doc.page} / 6')
    c.restoreState()

def make_guide():
    story = [
        p('Meme Mirror Setup and Operator Guide', 'title'),
        p('For the school Parent-Teacher Meeting on 14 October 2026', 'small'),
        p('This guide covers the complete setup, exhibition operation, local AI, reference management, recovery and shutdown. The game runs in Chrome on a Windows laptop at <b>http://127.0.0.1:4173</b>. Prepare it once with internet, then use the local files during the event.'),
        heading('Fast start on a prepared laptop'),
        *numbered([
            'Plug in the laptop, connect the display and webcam, and close other camera apps. Position the webcam so a child or an adult can face it comfortably.',
            'Double-click <b>Start Meme Mirror.bat</b> in the project folder. It starts or reuses the local server and opens Chrome when installed.',
            'Click <b>Enable camera</b> and allow camera access. Check that one face is visible in the mirrored preview.',
            'Before playing, use <b>Choose memes</b> if you want a different set. Select three different memes; both players receive the same set.',
            'For a connected TV, projector or smartboard, press <b>Windows+P</b> and choose <b>Duplicate</b> to show the laptop screen. Use <b>Fullscreen</b> or Chrome <b>F11</b>, and check that all controls fit.',
            'Click <b>Start playing</b>. The child completes three rounds, followed by the parent. Accept a result with <b>Next meme</b>, or offer <b>Retry round</b>.',
            'At the comparison screen, click <b>Next family</b>. During a session, <b>Reset family</b> clears both players\' scores while keeping the camera ready.',
        ]),
        heading('The current visitor experience'),
        p('Each round gives <b>3 seconds to prepare</b>, <b>4 seconds to try the face</b>, then about <b>1 second of tracked holding</b>, with at least 3 fresh measurements. A low or changing match score does not restart the hold; lost face tracking clears it. The participant\'s held frame appears beside the reference for <b>2.5 seconds</b>, then Next or Retry is available.'),
        p('<b>100% held means the short hold is complete.</b> Expression match is a separate 0-100 game score. There is no perfect-match requirement. A complete family session is intended to take roughly 75-100 seconds, including handover; rehearse the actual pace.'),
        p('This checkout is already prepared. New copies need the installation steps on page 2. Controls are on page 3, camera and reference settings on page 4, recovery on page 5, and the AI explanation and test limits on page 6.', 'small'),
        PageBreak(),
        p('Install once and prepare for offline use', 'page'),
        heading('Get the project and prerequisites'),
        p('Use Windows, Google Chrome, a working webcam and <b>Node.js 22 or newer</b>. Keep the complete project on a local drive. The repository is private: sign into your GitHub account to access it.'),
        p('<link href="https://github.com/13pathak/meme-mirror" color="#283022">github.com/13pathak/meme-mirror</link>'),
        p('Download the repository ZIP and extract it to <b>C:\\MemeMirror</b>, or use Git to clone into an empty destination. Git is optional for the exhibition; it is useful for obtaining and updating the source.'),
        Preformatted('git clone https://github.com/13pathak/meme-mirror.git C:\\MemeMirror\ncd C:\\MemeMirror\nnpm.cmd ci\nnpm.cmd run setup\nnpm.cmd run check:assets', ST['code']),
        p('If you downloaded a ZIP, skip the first command. If you use the current OneDrive checkout instead, open PowerShell in that project folder and run the same npm commands. The <b>.cmd</b> suffix avoids PowerShell npm script-policy issues.'),
        heading('What setup does'),
        p('<b>npm ci</b> installs the exact dependencies from package-lock.json. <b>npm run setup</b> copies the pinned MediaPipe JavaScript and WASM runtime and downloads the version-1 face model only if it is absent. <b>check:assets</b> verifies the required file checksums. MediaPipe Tasks Vision is pinned to 0.10.21. There is no application build step, database, account login or cloud inference service.'),
        p('The model, runtime, reference images and illustrations are project files. Fonts come from installed Windows system fonts; no font downloads are needed. Node serves the app; normal startup installs nothing. Once prepared, node_modules is unnecessary for normal serving, but retain it for setup and tests.'),
        heading('Make the event copy truly local'),
        *bullets([
            'Because the current project is in OneDrive, choose <b>Always keep on this device</b> for the folder, or copy the complete prepared project to a fully local folder such as C:\\MemeMirror.',
            'Keep public, scripts, assets-lock.json and both BAT launchers together. Export custom reference packs before moving machines or browser profiles.',
            'Do not open index.html directly. Always use <b>http://127.0.0.1:4173</b>. Opening file:// URLs will not provide the supported camera/model setup.',
        ]),
        heading('Rehearse a fresh offline startup'),
        p('Stop the server, close Chrome, disconnect Wi-Fi and Ethernet, then launch from the BAT file again. Enable the webcam and finish both turns. Close and restart once more to verify the saved choices and custom reference photos. A previously loaded tab does not prove offline readiness.'),
        PageBreak(),
        p('Run a family session', 'page'),
        heading('Choose the three memes'),
        p('Click <b>Choose memes</b> before Start. The library offers smile/grin, surprise, pout, wink, laughing grin and scowl. Remove a selected tile before adding another. The numbered tile badges show round order. Click <b>Use these three</b> to apply; closing the chooser cancels the draft. Choices persist for the next family, and setup changes require a reset.'),
        p('The default set keeps the working human grin. <b>The plot twist</b> and <b>The samosa situation</b> use their original illustrations and preset targets. The newer wink, laughing-grin and scowl choices are also preset-based; try them live before using them with visitors.'),
        heading('Round timing and handover'),
        table(['Phase', 'What happens', 'Visitor or operator action'], [
            ['Prepare', '3, 2, 1 countdown', 'Look at the reference and get ready.'],
            ['Try the face', '4-second attempt period', 'Copy the expression comfortably.'],
            ['Hold', 'About 1 second with fresh tracking', 'Keep one face in view. Score changes do not reset progress.'],
            ['Photo reveal', 'Held frame and match score for 2.5 seconds', 'Enjoy the result. The picture disappears automatically.'],
            ['Continue', 'Next or Retry becomes available', 'Next accepts the round. Retry replaces its score.'],
            ['Parent turn', 'After the child\'s third result', 'Click Parent\'s turn, then Start parent\'s turn. Repeat the same three memes.'],
            ['Comparison', 'Three scores per person, out of 300', 'Read the cheerful comparison and click Next family.'],
        ], [86, 169, WIDTH-255]),
        Spacer(1, 8),
        heading('Useful controls'),
        p('<b>Reset family</b> clears session scores and returns to the child\'s first round, while keeping the camera and meme choices. <b>Retry round</b> repeats just the current round. <b>Next meme</b> accepts a completed result; it is locked during the photo reveal. A reset button is available inside the reveal too.'),
        p('Spectators should stay outside the camera view. If tracking disappears or two faces are detected, the score and hold clear. Reposition the player and continue; do not ask them to keep straining. An operator dialog or hidden browser tab pauses the round.'),
        PageBreak(),
        p('Camera and reference settings', 'page'),
        heading('Use the operator desk'),
        p('Open the <b>gear</b> at the top right. It pauses the game while diagnostics stay available. Reset the family before changing cameras, execution mode or references.'),
        *bullets([
            '<b>Camera:</b> select the built-in or USB webcam, then click <b>Reconnect camera</b>. Device labels appear after camera permission is granted.',
            '<b>Execution:</b> GPU preferred falls back to CPU if GPU setup or inference fails. If GPU is simply slow, choose <b>CPU only</b> and reconnect. This choice resets on a page reload.',
            '<b>Diagnostics:</b> inspect actual resolution, observed update rate, mean inference time, face count and movement values. The requested camera size is 640 x 480; 12 updates/second is a scheduling target, not a promised rate.',
            '<b>Camera lab:</b> use the operator link or open /feasibility.html to see movements respond. Close that tab before the game to release its camera/model.',
        ]),
        heading('Restore a dependable default set'),
        p('Under <b>Default faces</b>, choose <b>Working grin + original demos</b> or <b>Original illustrated demos</b>, then click <b>Use selected defaults for all three</b>. This clears saved slot overrides and restores smile, surprise and pout as the three choices. Export your custom pack first if you want to retain it. <b>Restore this demo</b> restores only the selected slot.'),
        heading('Add a custom human reference'),
        *numbered([
            'Reset the family. Choose one of the six expression slots in the operator desk.',
            'Enter a short caption and select a local JPG, PNG or WebP under 12 MB. Prefer a well-lit human face with eyes and mouth visible.',
            'Click <b>Analyse &amp; save reference</b>. The same local model analyses it once. Exactly one face and meaningful primary expression movement are required; invalid photos do not replace the reference.',
            'Try the new target yourself and with a child. A detected face alone does not establish that the expression is easy to imitate.',
        ]),
        heading('Back up choices and reference packs'),
        p('Custom photos, captions and targets are kept in this Chrome profile\'s localStorage. The exact origin is <b>127.0.0.1:4173</b>; localhost, a different port or another profile has separate storage. <b>Export reference pack</b> backs up reference overrides as JSON, including any explicit demo-slot overrides. <b>Import reference pack</b> accepts your own verified exports without re-running photo analysis.'),
        p('Bundled references remain project assets. Participant pictures are separate: the reveal uses a temporary canvas and does not save, encode or upload them. Export packs contain operator reference photos, so keep those backups appropriately.'),
        PageBreak(),
        p('Troubleshooting and closing the station', 'page'),
        p('Use the shortest recovery that addresses the message on screen. Keep a standing mark for one player, improve lighting and position the webcam for each height.'),
        table(['Symptom', 'Action'], [
            ['Camera permission denied', 'Allow camera access through Chrome\'s address-bar/site settings, then retry Enable camera.'],
            ['No camera or camera busy', 'Connect/reconnect the webcam. Close Teams, Zoom, camera apps and duplicate game/lab tabs using it.'],
            ['No face or multiple faces', 'Face the webcam with eyes and mouth visible. Spectators step outside the view.'],
            ['Slow tracking or model error', 'Reset family, choose CPU only and reconnect. If assets are missing, rerun setup online; restore damaged reference PNGs from the project backup.'],
            ['Node is missing', 'Install Node.js 22 or newer, reopen the terminal and follow page 2.'],
            ['Launch failed or port 4173 busy', 'Read server-error.log and server.log. Stop the other server/app on that port. Do not stop an unknown process.'],
            ['A custom reference disappeared', 'Use the same Chrome profile and exact address. Re-import your exported pack if site data was cleared.'],
            ['Display clips the controls', 'Use F11 and adjust Chrome zoom. Check the connected display resolution and viewing distance.'],
        ], [143, WIDTH-143]),
        Spacer(1, 6),
        heading('Stop the camera and server'),
        p('Use Operator desk &gt; <b>Turn camera off</b>, or close the game tab, then double-click <b>Stop Meme Mirror.bat</b>. The stop script checks the recorded process belongs to this project before stopping it. Repeated Start launches reuse an existing server from the same folder.'),
        p('For a visible terminal server, run <b>npm.cmd start</b> in the project folder and keep that terminal open. Press <b>Ctrl+C</b> there to stop it. The BAT launcher can reuse a manually started server, but that server remains under its terminal\'s control.'),
        heading('Before the queue arrives'),
        p('Complete a parent-and-child run, check projector readability, rehearse retry/reset/default restoration, and run repeated sessions for at least 30 minutes. Test a genuinely fresh offline startup. Keep the laptop powered, prevent sleep during the event, and have the printed visitor poster beside the standing area.'),
        PageBreak(),
        p('How the local AI and scoring work', 'page'),
        p('A worker runs the local MediaPipe Face Landmarker on webcam frames, producing landmarks and 52 blendshape coefficients. Our code compares selected movements. Inference runs one frame at a time, with no growing queue.'),
        p('The preview/reveal are mirrored; inference is unmirrored. Paired movements are averaged. Wink uses the eye-blink difference and penalises both eyes closing. Scoring compares movements rather than identity or raw image resemblance.'),
        heading('The comparison formula'),
        p('Only relevant features with non-trivial targets earn points. Let x be a measured movement, t its target, w its weight and tolerance its allowed variation. For the active features:'),
        Preformatted('E = weighted mean of clamp(abs(x - t) / tolerance, 0, 1)\nA = weighted mean of clamp(x / t, 0, 1)\nP = sum(conflict_weight * clamp(x - t - 0.12, 0, 1))\nmatch = 100 * clamp((1 - E) * A - P, 0, 1)', ST['code']),
        p('E measures movement difference; A reduces points when the requested movement is missing; P penalises conflicting movements. Irrelevant inactive features add no points. Features are smoothed over a 180 ms time constant. The final score is the rounded mean from the short tracked hold. It is a playful game scale, not scientific accuracy or an emotion reading.'),
        heading('Where to tune or inspect the code'),
        table(['File', 'Purpose'], [
            ['public/scoring.js', 'Six preset targets, weights, tolerances, features and score formula.'],
            ['public/builtin-references.js', 'The measured working-grin target and its custom weights.'],
            ['public/game.js', 'Round state, 3/4/1-second timing, fresh-sample and tracking rules.'],
            ['public/camera.js and vision-worker.js', 'Camera scheduling, model execution, CPU fallback and frame lifetime.'],
            ['public/reveal.js and references.js', '2.5-second picture cleanup and operator reference persistence.'],
            ['scripts and assets-lock.json', 'Preparation, checksums, loopback server and Windows launch/stop.'],
        ], [191, WIDTH-191], padding=6),
        Spacer(1, 6),
        heading('Evidence and limits'),
        p('The comfortable-hold update passed <b>26 unit tests and 13 targeted Chrome checks</b>, including weak/fluctuating pout input, loss of tracking, photo cleanup, both-player flow and real local model execution. Some tests use synthetic camera input or measurements. They do not replace the actual laptop/camera, lighting, live adults/children, connected display, 30-minute run and physically disconnected startup checks.'),
        p('Ordinary play makes no cloud inference calls, uses no API tokens and asks for no names. Session scores are cleared on reset; the temporary picture\'s pixels clear after the reveal, on reset or when the page is hidden/closed. See README.md, TEST-RESULTS.md, REFERENCE-CHECKS.md and EXHIBITION-CHECKLIST.md for current source details.', 'small'),
    ]
    doc = SimpleDocTemplate(str(OUT / 'Meme-Mirror-Setup-and-Operator-Guide.pdf'), pagesize=A4,
        leftMargin=48, rightMargin=48, topMargin=53, bottomMargin=55,
        title='Meme Mirror Setup and Operator Guide', author='Meme Mirror', subject='End to end setup and operation for PTM 14 October 2026')
    doc.build(story, onFirstPage=footer, onLaterPages=footer)

def face(c, x, y, kind, r=46):
    c.saveState()
    c.setFillColor(colors.HexColor('#ffcf59'));c.setStrokeColor(INK);c.setLineWidth(2.5);c.circle(x,y,r,stroke=1,fill=1)
    c.setFillColor(INK)
    if kind=='surprise':
        for dx in [-.35,.35]:
            c.setFillColor(colors.white);c.ellipse(x+dx*r-10,y+8,x+dx*r+10,y+30,stroke=1,fill=1)
            c.setFillColor(INK);c.ellipse(x+dx*r-3,y+13,x+dx*r+3,y+24,stroke=0,fill=1)
        c.ellipse(x-10,y-35,x+10,y-5,stroke=0,fill=1)
    elif kind=='pout':
        for dx in [-.34,.34]:c.ellipse(x+dx*r-4,y+5,x+dx*r+4,y+17,stroke=0,fill=1)
        c.setLineWidth(4);c.line(x-26,y+26,x-8,y+19);c.line(x+26,y+26,x+8,y+19)
        c.setFillColor(colors.HexColor('#dd8673'));c.ellipse(x-14,y-26,x+14,y-12,stroke=1,fill=1)
        c.setLineWidth(2);c.line(x-10,y-19,x+10,y-19)
    else:
        c.setLineWidth(5)
        c.arc(x-31,y+4,x-8,y+24,startAng=0,extent=180)
        c.arc(x+8,y+4,x+31,y+24,startAng=0,extent=180)
        c.setFillColor(INK);p=c.beginPath();p.moveTo(x-27,y-5);p.curveTo(x-12,y-11,x+12,y-11,x+27,y-5);p.curveTo(x+19,y-39,x-19,y-39,x-27,y-5);c.drawPath(p,stroke=1,fill=1)
        c.setFillColor(colors.white);c.roundRect(x-20,y-15,40,8,2,stroke=0,fill=1)
    c.restoreState()

def make_poster():
    target=OUT / 'Meme-Mirror-PTM-Visitor-Poster-A3.pdf'
    c=canvas.Canvas(str(target),pagesize=A3)
    c.setTitle('Meme Mirror PTM Visitor Poster');c.setAuthor('Meme Mirror');c.setSubject('Visitor instructions for PTM 14 October 2026')
    w,h=A3
    c.setFillColor(colors.white);c.rect(0,0,w,h,stroke=0,fill=1)
    left=50;right=w-50;inner=right-left
    c.setFillColor(INK);c.setFont('MMArialBold',60);c.drawString(left,h-94,'Meme Mirror')
    c.setFillColor(MUTED);c.setFont('MMArialBold',14);c.drawString(left,h-124,'FAMILY FACE-OFF  |  PTM 14 OCTOBER 2026')
    c.setFillColor(INK);c.setFont('MMArialBold',25);c.drawString(left,h-172,'Copy the face. Hold it. See your score!')
    for x,kind,label in [(left+135,'smile','SMILE'),(w/2,'surprise','SURPRISE'),(right-135,'pout','POUT')]:
        face(c,x,h-255,kind,48)
        c.setFillColor(MUTED);c.setFont('MMArialBold',14);c.drawCentredString(x,h-326,label)
    c.setFillColor(MINT);c.roundRect(left,h-402,inner,53,12,stroke=0,fill=1)
    c.setFillColor(INK);c.setFont('MMArialBold',23);c.drawCentredString(w/2,h-381,'CHILD FIRST  |  PARENT NEXT')
    c.setFont('MMArial',18);c.drawCentredString(w/2,h-430,'Three memes each. The same challenge for both.')
    steps=[
        ('Step into view', 'One player in the camera. Press Start playing.'),
        ('Copy the meme', 'Watch 3, 2, 1 - then try the expression.'),
        ('Hold for one second', 'When asked, hold comfortably until 100% held.'),
        ('Enjoy your photo and score', 'Your picture flashes briefly. Then press Next meme.'),
        ('Pass the spotlight', 'After 3 rounds: Parent\'s turn, then Start parent\'s turn.'),
        ('Celebrate and start again', 'See your totals. Press Next family for new players.'),
    ]
    start=h-486;row=89
    for i,(title,body)in enumerate(steps):
        y=start-i*row
        c.setFillColor([YELLOW,PINK,BLUE][i%3]);c.circle(left+25,y-6,25,stroke=0,fill=1)
        c.setFillColor(INK);c.setFont('MMArialBold',23);c.drawCentredString(left+25,y-14,str(i+1))
        c.setFont('MMArialBold',26);c.drawString(left+65,y+2,title)
        c.setFont('MMArial',20);c.drawString(left+65,y-28,body)
    c.setFillColor(MINT);c.roundRect(left,118,inner,54,12,stroke=0,fill=1)
    c.setFillColor(INK);c.setFont('MMArialBold',21);c.drawCentredString(w/2,138,'No perfect expression needed. Just give it a go!')
    c.setFillColor(MUTED);c.setFont('MMArial',15);c.drawCentredString(w/2,86,'One face at a time. Keep spectators outside the camera view.')
    c.setFont('MMArialBold',15);c.drawCentredString(w/2,59,'No names needed. No photos saved. Match score is just for fun.')
    c.showPage();c.save()

if __name__=='__main__':
    make_guide();make_poster()
    print('Created the operator guide and A3 visitor poster in output/pdf.')
