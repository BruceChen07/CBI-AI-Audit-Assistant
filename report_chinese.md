# Chinese Text Scan Report

- Root: `D:\Workspace\hackathon`
- Total files scanned: 74
- Files with hits: 30
- Total hits: 198

## Summary by extension
- `.css`: 20
- `.js`: 117
- `.md`: 27
- `.py`: 34

## Summary by top-level directory
- `.`: 27
- `frontend`: 137
- `src`: 34

## Details
### D:\Workspace\hackathon\SMOKE_TEST.md
- L   1, C  3: # «后»«端»«冒»«烟»«测»«试»«与»«部»«署»«要»«点»«（»Windows«）»
- L   3, C  4: ## «环»«境»«准»«备»
- L   4, C 15: - Python 3.10+«（»«建»«议»«与»«项»«目»«的» .venv «对»«齐»«）»
- L   5, C 11: - Windows «终»«端»«：»cmd.exe
- L   6, C  3: - «可»«选»«：»«项»«目»«自»«带»«虚»«拟»«环»«境» .venv «或» test_env
- L   8, C  4: ## «关»«键»«环»«境»«变»«量»
- L   9, C 11: - API_BASE«：»«后»«端» API «根»«地»«址»«（»«默»«认» http://localhost:8000«）»
- L  10, C 34: - ADMIN_USERNAME / ADMIN_PASSWORD«：»«管»«理»«员»«账»«号»«；»«需»«与»«后»«端»«启»«动»«时»«的»«环»«境»«变»«量»«一»«致»«（»«后»«端»«会»«按»«这»«两»«个»«变»«量»«在» SQLite «中»«创»«建»«初»«始»«管»«理»«员»«）»
- L  12, C  3: > «后»«端»«会»«在»«启»«动»«时»«读»«取» ADMIN_USERNAME/ADMIN_PASSWORD «创»«建»«初»«始»«管»«理»«员»«。»«若»«未»«设»«置»«，»«登»«录»«接»«口»«将»«无»«法»«用»«默»«认»«值»«通»«过»«。»
- L  14, C  4: ## «启»«动»«后»«端»
- L  15, C  3: - «推»«荐»«使»«用»«项»«目»«根»«目»«录»«的» start_services.bat«（»«如»«存»«在»«）»«启»«动»«后»«端»
- L  16, C  3: - «或»«手»«动»«启»«动»«（»«示»«例»«）»«：»
- L  17, C  6:   1. «激»«活»«虚»«拟»«环»«境»«（»«任»«选»«其»«一»«）»
- L  20, C  6:   2. «安»«装»«依»«赖»
- L  22, C  6:   3. «设»«置»«环»«境»«变»«量»«（»«示»«例»«）»
- L  25, C  6:   4. «启»«动»«服»«务»«（»«示»«例»«）»
- L  28, C  4: ## «运»«行»«冒»«烟»«测»«试»
- L  29, C  3: - «直»«接»«双»«击» run_smoke_test.bat«，»«或»«在» cmd «中»«执»«行»«：»
- L  31, C  3: - «脚»«本»«会»«：»
- L  32, C  6:   1. «自»«动»«选»«择» Python «解»«释»«器»«（»«优»«先» .venv«，»«其»«次» test_env«，»«最»«后»«系»«统» python«）»
- L  33, C  6:   2. «自»«动»«安»«装» requests«（»«若»«缺»«失»«）»
- L  34, C  6:   3. «探»«测» API «健»«康»«检»«查»«（»/test/«）»«，»«若»«不»«通»«尝»«试»«调»«用» start_services.bat «并»«轮»«询»«等»«待»
- L  35, C  6:   4. «执»«行» test/smoke_api.py«：»
- L  41, C  4: ## «常»«见»«问»«题»
- L  42, C  3: - «登»«录»«失»«败»«：»«确»«认»«后»«端»«启»«动»«时»«设»«置»«了» ADMIN_USERNAME/ADMIN_PASSWORD«，»«并»«与» run_smoke_test.bat «使»«用»«的»«一»«致»
- L  43, C  3: - «端»«口»«冲»«突»«：»«调»«整» API_BASE «或» uvicorn «启»«动»«端»«口»«（»--port«）»
- L  44, C  3: - «依»«赖»«问»«题»«：»«优»«先»«在» .venv «或» test_env «中»«运»«行»«；»«必»«要»«时»«执»«行» pip install -r requirements.txt

### D:\Workspace\hackathon\frontend\src\App.css
- L  12, C 47:   background-color: rgba(40, 44, 52, 0.9); /* «添»«加»«透»«明»«度»«以»«便»«看»«到»«背»«景» */
- L  26, C 48:   background-color: rgba(58, 63, 75, 0.95); /* «添»«加»«透»«明»«度» */
- L 121, C  4: /* «表»«格»«单»«元»«格» */
- L 128, C  4: /* «可»«选»«：»«给»«表»«格»«行»«添»«加»«平»«滑»«过»«渡»«，»«悬»«停»«更»«柔»«和» */
- L 133, C  4: /* «将»«悬»«停»«背»«景»«从»«深»«色»«改»«为»«淡»«绿»«色» */
- L 138, C  4: /* «两»«栏»«布»«局»«样»«式» */
- L 209, C  7: /* PDF«查»«询»«相»«关»«样»«式» */
- L 237, C  4: /* «表»«格»«增»«强»«样»«式» */
- L 245, C  4: /* «批»«量»«处»«理»«按»«钮»«样»«式» */
- L 285, C  4: /* «批»«量»«查»«询»«控»«制»«样»«式» - «保»«持»«向»«后»«兼»«容» */
- L 314, C  4: /* «进»«度»«条»«样»«式» */
- L 396, C  9: /* Excel«上»«传»«成»«功»«提»«示»«样»«式» */
- L 427, C  6: /* AI«结»«果»«列»«样»«式» */
- L 476, C  6: /* AI«查»«询»«结»«果»«样»«式» */
- L 631, C  4: /* «下»«载»«按»«钮»«样»«式» */
- L 677, C  4: /* «新»«增»«：»«禁»«用»«态»«置»«灰»«样»«式» */
- L 706, C  4: /* «失»«败»«记»«录»«重»«试»«功»«能»«样»«式» */
- L 851, C  4: /* «响»«应»«式»«设»«计» */
- L 911, C  4: /* «响»«应»«式»«背»«景»«图» */
- L 914, C 39:     background-attachment: scroll; /* «移»«动»«设»«备»«上»«使»«用» scroll */

### D:\Workspace\hackathon\frontend\src\App.js
- L  42, C 56:   const [sessionId, setSessionId] = useState(null); // «新»«增»«：»«管»«理» sessionId «状»«态»
- L  43, C 99: yStats, setBatchQueryStats] = useState({ total: 0, success: 0, failed: 0 }); // «新»«增»«：»«管»«理»«统»«计»«信»«息»
- L  54, C  6:   // «新»«增»«：»«事»«件»«处»«理»«回»«调»«，»«供»«子»«组»«件»«调»«用»«，»«修»«复»«未»«定»«义»«错»«误»
- L  58, C  8:     // «数»«据»«变»«化»«后»«，»«重»«置»«下»«载»«就»«绪»«状»«态»
- L  82, C  6:   // «新»«增»«：»«当»«面»«板»«打»«开»«时»«，»«如»«果»«角»«色»«不»«是» admin«，»«则»«自»«动»«关»«闭»
- L 100, C 25:         {/* Admin Panel «入»«口»«守»«卫» */}
- L 124, C 32:         {/* Download section - «使»«用»«新»«架»«构» */}
- L 140, C  4: // «无»«权»«限»«面»«板»«（»«内»«联»«）»

### D:\Workspace\hackathon\frontend\src\components\AdminLoginModal.js
- L  46, C 10:       // «明»«确»«区»«分»«账»«号»/«密»«码»«错»«误»
- L  49, C 19:         setError("«账»«号»«或»«密»«码»«错»«误»");
- L  51, C 26:         setError(msg || "«登»«录»«失»«败»");

### D:\Workspace\hackathon\frontend\src\components\AdminLoginPage.js
- L  41, C 10:       // «登»«录»«后»«根»«据» redirect «参»«数»«跳»«回»«目»«标»«（»«更»«健»«壮»«的»«跳»«转»«方»«式»«）»
- L  45, C 61:       let redirect = params.get("redirect") || "/";      // «默»«认»«跳»«回»«首»«页»
- L  46, C 62:       if (!redirect.startsWith("/")) redirect = "/";      // «兜»«底»«：»«非»«法»«值»«回»«首»«页»
- L  49, C 13:       // 1) «使»«用» replace «避»«免»“«后»«退»«回»«到»«登»«录»«页»”
- L  53, C 13:       // 2) «极»«少»«数»«情»«况»«下»«备»«用»«：»«确»«保»«触»«发»«一»«次» hashchange
- L  64, C 19:         setError("«您»«没»«有»«权»«限»«或»«账»«号»/«密»«码»«错»«误»");
- L  66, C 26:         setError(msg || "«登»«录»«失»«败»");
- L 122, C 11:           «登»«录»«成»«功»«后»«将»«进»«入» Admin «面»«板»«页»«面»

### D:\Workspace\hackathon\frontend\src\components\AdminMenu.js
- L  29, C  8:     // «登»«录»/«注»«销»«等»«变»«化»«时»«，»«刷»«新» session
- L  54, C  8:     // «立»«即»«刷»«新»«菜»«单»«显»«示»
- L  82, C 11:       {/* «弹»«窗»«版»«登»«录»«已»«废»«弃» */}

### D:\Workspace\hackathon\frontend\src\components\BatchProcessing.js
- L  17, C  6:   // «监»«听» sessionId «变»«化»«并»«通»«知»«父»«组»«件»
- L  25, C  6:   // «监»«听» batchQueryStats «变»«化»«并»«通»«知»«父»«组»«件»
- L  33, C  6:   // «监»«听»«批»«量»«查»«询»«完»«成»«状»«态»
- L  57, C 10:       // «传»«递»«来»«源»«标»«记»«，»«避»«免»«父»«组»«件»«重»«置» sessionId

### D:\Workspace\hackathon\frontend\src\components\DownloadResults.js
- L   7, C  6:   // «使»«用»«新»«的»«下»«载»«架»«构»«：»«通»«过» session_id «直»«接»«从»«后»«端»«缓»«存»«下»«载»
- L  25, C 10:       // «使»«用»«新»«的»«下»«载»«接»«口»«：»«通»«过» session_id «直»«接»«下»«载»
- L  40, C 10:       // «从»«响»«应»«头»«获»«取»«文»«件»«名»
- L  78, C  6:   // «始»«终»«渲»«染»«下»«载»«区»«域»«，»«按»«钮»«根»«据»«状»«态»«禁»«用»

### D:\Workspace\hackathon\frontend\src\components\admin\AdminConfigPage.js
- L  20, C  6:   // «验»«证»«逻»«辑»
- L  33, C  6:   // «警»«告»«计»«算»
- L  42, C 28:         w.pricing_model = "«该»«值»«看»«起»«来»«不»«像»«预»«置»«名»«或»CSV«路»«径»«，»«保»«存»«后»«会»«按»«原»«样»«提»«交»«到»«后»«端»«。»";
- L  44, C 28:         w.pricing_model = "«检»«测»«到»«路»«径»«，»«建»«议»«使»«用» .csv «文»«件»«以»«获»«得»«最»«佳»«兼»«容»«性»«。»";
- L  50, C  6:   // «事»«件»«处»«理»«函»«数»
- L 118, C 63:       const resp = await apiFetch("/admin/model-catalog"); // «修»«改»«：»«从» /admin/models «改»«为» /admin/model-catalog
- L 128, C  6:   // «计»«算»«属»«性»
- L 184, C  6:   // «初»«始»«化»
- L 215, C 18:           title="«当»«前»«模»«型»«详»«情»"

### D:\Workspace\hackathon\frontend\src\components\admin\AdminMetricsPage.js
- L  20, C  6:   // «新»«增»«：»«从» summary «派»«生» Total Cost«，»«默»«认» 0
- L  57, C 11:       {/* «标»«题» + «总»«成»«本»«优»«雅»«徽»«章» */}
- L  81, C 15:           {/* «简»«洁»«图»«标» */}
- L  95, C 11:       {/* «原»«有»«筛»«选»«器»«、»«概»«览»«卡»«片»«、»«图»«表»«、»«表»«格» */}
- L  96, C 11:       {/* «注»«意»«：»«下»«面»«是»«原»«有»«内»«容»«，»«无»«需»«改»«动» */}

### D:\Workspace\hackathon\frontend\src\components\admin\AdminPanel.js
- L  53, C  8:     // «打»«开»«面»«板»«时»«恢»«复»«上»«次» Tab
- L  58, C  8:     // «登»«录»«状»«态»/«角»«色»«变»«化»«时»«刷»«新»«（»«例»«如» 401 «自»«动»«注»«销»«）»

### D:\Workspace\hackathon\frontend\src\components\admin\AdminPanelPage.js
- L  15, C  6:   // «未»«登»«录»«时»«自»«动» 1.2s «跳»«到»«登»«录»«页»«，»«并»«带»«上» redirect «返»«回»«当»«前»«目»«标»
- L  26, C  6:   // «左»«侧»«三»«分»«区»«状»«态»«：»"access" | "config" | "cost"
- L  29, C  6:   // «可»«选»«：»«初»«次»«从» URL «读»«取» section«（»?section=config / cost / access«）»
- L  39, C  6:   // «可»«选»«：»«状»«态»«变»«化»«时»«同»«步»«到» URL«，»«便»«于»«刷»«新»«记»«忆»

### D:\Workspace\hackathon\frontend\src\components\admin\AdminUsersPage.js
- L  16, C  6:   // «统»«一»«禁»«用»«条»«件»«，»«方»«便»«复»«用»«样»«式»

### D:\Workspace\hackathon\frontend\src\components\admin\NoAccess.js
- L  16, C 44:         <h2 style={{ margin: "0 0 12px" }}>«无»«权»«限»«访»«问»</h2>
- L  18, C 11:           «请»«使»«用»«管»«理»«员»«账»«号»«登»«录»«后»«访»«问» Admin «面»«板»«。»
- L  31, C 11:           «去»«登»«录»

### D:\Workspace\hackathon\frontend\src\components\admin\StatCards.js
- L  20, C 51:   const sentiment = totals?.outputTokens ?? 0; // «仍»«按»«之»«前»«口»«径»«映»«射»«为»“«总»«输»«出» tokens”
- L  21, C 54:   const avgRating = totals?.avgTokensPerReq ?? 0; // «仍»«按»«之»«前»«口»«径»«映»«射»«为»“«平»«均» tokens/«请»«求»”

### D:\Workspace\hackathon\frontend\src\components\admin\Topbar.js
- L  16, C 11:           «欢»«迎»«回»«来»«，»{username}{loading ? " · «正»«在»«加»«载»…" : ""}{error ? " · «加»«载»«失»«败»" : ""}

### D:\Workspace\hackathon\frontend\src\components\admin\components\MetricsCharts.js
- L  59, C  6:   // «与»«原»«逻»«辑»«保»«持»«一»«致»«：»«根»«据»«数»«据»«量»«拉»«宽»«画»«布»«，»«外»«层»«容»«器»«可»«横»«向»«滚»«动»
- L  70, C  6:   // «高»«亮»«：»«非»«选»«中»«系»«列»«整»«体»«降»«低»«透»«明»«度»

### D:\Workspace\hackathon\frontend\src\components\admin\components\ModelCatalog.js
- L   1, C  4: // «文»«件»«：»ModelCatalog.js«（»«仅»«保»«留»«卡»«片»«详»«情» + «高»«级»«字»«段»«折»«叠»«版»«本»«）»
- L  13, C  6:   // «关»«键»«字»«段»«优»«先»«显»«示»«（»«按»«你»«的» CSV «字»«段»«名»«自»«行»«调»«整»«）»
- L  29, C  6:   // «友»«好»«值»«格»«式»«化»
- L  34, C  8:     // «成»«本»«字»«段»«保»«留»«美»«元»«符»«号»
- L  39, C  6:   // «仅»«展»«示»«当»«前»«选»«中»«模»«型»«的»«信»«息»
- L  51, C  9:         «请»«选»«择»«左»«侧»«模»«型»«或»«在»«设»«置»«中»«选»«择»«一»«个»«模»«型»«以»«查»«看»«详»«细»«信»«息»
- L  56, C  6:   // «组»«装»«详»«情»«数»«据»
- L  67, C  6:   // «统»«一»«浅»«色»«卡»«片»«样»«式»
- L 122, C  6:   // «渲»«染»
- L 127, C 13:         {/* «关»«键»«字»«段»«（»«两»«列»«栅»«格»«）» */}
- L 137, C 13:         {/* «高»«级»«字»«段»«折»«叠» */}
- L 152, C 32:               {showAdvanced ? "«收»«起»«更»«多»«字»«段»" : "«展»«开»«更»«多»«字»«段»"}
- L 157, C 48:                 <div style={sectionTitleStyle}>«更»«多»«字»«段»</div>

### D:\Workspace\hackathon\frontend\src\components\admin\components\SettingsForm.js
- L   6, C 16:   cfg = {}, // «使»«用»cfg«而»«不»«是»config«，»«与»AdminConfigPage«保»«持»«一»«致»
- L   7, C 21:   onChangeField, // «使»«用»onChangeField«而»«不»«是»onConfigChange
- L  19, C 26:   selectedRow = null, // «新»«增»«：»«选»«中»«的»«模»«型»«行»«数»«据»
- L  20, C 26:   getByPattern = null // «新»«增»«：»«获»«取»«模»«型»«字»«段»«的»«函»«数»
- L  36, C  6:   // «从»«选»«中»«的»«模»«型»«行»«获»«取»«成»«本»«信»«息»
- L  55, C 11:       {/* «显»«示»«错»«误»«信»«息» */}
- L  70, C 11:       {/* «显»«示»«字»«段»«验»«证»«错»«误» */}
- L  87, C 11:       {/* «显»«示»«警»«告»«信»«息» */}
- L 104, C 11:       {/* «显»«示»«保»«存»«成»«功»«信»«息» */}

### D:\Workspace\hackathon\frontend\src\components\admin\styles\commonStyles.js
- L   1, C  4: // «控»«件»«样»«式»
- L  12, C  4: // «标»«签»«样»«式»
- L  21, C  4: // «基»«础»«按»«钮»«样»«式»
- L  34, C  4: // «主»«要»«按»«钮»«样»«式»
- L  41, C  4: // «次»«要»«按»«钮»«样»«式»
- L  48, C  4: // «幽»«灵»«按»«钮»«样»«式»
- L  56, C  4: // «表»«格»«样»«式»
- L  66, C  4: // «单»«元»«格»«样»«式»

### D:\Workspace\hackathon\frontend\src\components\admin\utils\formatters.js
- L   1, C  4: // «格»«式»«化»«工»«具»«函»«数»
- L  17, C  7: // CSV«导»«出»«工»«具»«函»«数»
- L  29, C  4: // «下»«载»CSV«文»«件»
- L  40, C  4: // «日»«期»«格»«式»«化»
- L  45, C  4: // «获»«取»«默»«认»«日»«期»«范»«围»«（»«最»«近»7«天»«）»

### D:\Workspace\hackathon\frontend\src\components\admin\utils\validators.js
- L   1, C  4: // «配»«置»«验»«证»«函»«数»
- L  12, C  4: // «计»«算»«配»«置»«警»«告»
- L  23, C  4: // «检»«查»«配»«置»«是»«否»«有»«变»«更»

### D:\Workspace\hackathon\frontend\src\hooks\useBatchQuery.js
- L  13, C 56:   const [sessionId, setSessionId] = useState(null); // «新»«增»«：»«存»«储» session_id
- L  29, C 28:     setSessionId(null); // «重»«置» session_id
- L  32, C 10:       // «使»«用»«流»«式»«接»«口»«获»«取»«实»«时»«进»«度»
- L  66, C 20:                 // «实»«时»«更»«新»«进»«度»
- L  76, C 20:                 // «处»«理»«完»«成»
- L  80, C 20:                 // «获»«取»«并»«存»«储» session_id
- L  86, C 20:                 // «调»«用»«回»«调»«函»«数»«，»«传»«递»«处»«理»«后»«的»«数»«据»
- L  93, C 20:                 // «处»«理»«统»«计»«信»«息»
- L 146, C 19:     sessionId, // «新»«增»«：»«返»«回» session_id

### D:\Workspace\hackathon\frontend\src\index.js
- L  49, C  8:     // «未»«登»«录»«则»«带»«上» redirect «参»«数»«跳»«转»«到»«登»«录»«页»
- L  51, C 62:       const redirect = encodeURIComponent(hash.slice(1)); // «形»«如» "/admin-panel?section=config"
- L  57, C 11:   // NEW: «首»«页»«必»«须»«登»«录»
- L  59, C 50:     const redirect = encodeURIComponent("/"); // «登»«录»«后»«返»«回»«首»«页»
- L  78, C  4: // «注»«册»«刷»«新»«器»«（»«需»«要»«后»«端»«提»«供» /auth/refresh«）»

### D:\Workspace\hackathon\frontend\src\utils\api.js
- L 112, C 10:       // «仅»«在»“«非» refresh «请»«求» «且» attachAuth=true”«时»«执»«行»«硬»«登»«出»

### D:\Workspace\hackathon\frontend\src\utils\fileUtils.js
- L  30, C  8:     // «修»«改»«请»«求»URL«，»«匹»«配»«后»«端»«端»«口»«和»«路»«径»
- L  46, C  8:     // «获»«取»«文»«件»blob
- L  49, C  8:     // «创»«建»«下»«载»«链»«接»
- L  55, C  8:     // «触»«发»«下»«载»
- L  59, C  8:     // «清»«理»

### D:\Workspace\hackathon\src\main.py
- L  84, C  7:     # «从» DB «恢»«复» PRICING_FILE«（»«重»«启»«后»«仍»«然»«生»«效»«）»
- L  90, C 15:             # «与» routes «中»«一»«致»«的»«解»«析»«逻»«辑»«（»«简»«化»«版»«）»

### D:\Workspace\hackathon\src\rag_service.py
- L  53, C  3: # «默»«认»«常»«量»«（»«作»«为»«后»«备»«值»«和»«兼»«容»«导»«出»«项»«）»
- L  59, C 17:     Lazy import «避»«免»«潜»«在»«循»«环»«依»«赖»«。»«失»«败»«时»«返»«回» None«。»
- L  69, C  5:     «返»«回» Admin «配»«置»«中»«的»«模»«型»«；»«若»«不»«可»«用»«，»«则»«退»«回»«到» MAX_AI_MODEL«。»
- L  77, C  5:     «返»«回» Admin «配»«置»«中»«的»«温»«度»«；»«若»«不»«可»«用»«，»«则»«退»«回»«到» TEMPERATURE«。»
- L 275, C 85:     s = re.sub(r'^(Certainly|Sure|Of course|Absolutely|Great|Okay|Ok|No problem|«当»«然»|«没»«问»«题»|«好»«的»)[!,.«，»«。»]?\s+', '', s, flags=re.IGNORECASE)
- L 276, C 53:         s = re.sub(r'^(Below (is|are)|Here (is|are)|«以»«下»«为»)\b[^\n]*\n+', '', s, flags=re.IGNORECASE)
- L 318, C125: conversational openers such as "Certainly", "Sure", "Of course", "Absolutely", "«好»«的»", "«没»«问»«题»", "«当»«然»".
- L 336, C125: conversational openers such as "Certainly", "Sure", "Of course", "Absolutely", "«好»«的»", "«没»«问»«题»", "«当»«然»".
- L 355, C 76: Avoid any conversational openers (e.g., "Certainly", "Sure", "Of course", "«好»«的»", "«当»«然»") and do not include greetings or exclamation marks.
- L 361, C 11:         # «动»«态»«创»«建»«基»«于»«当»«前»«配»«置»«的» LLM «客»«户»«端»
- L 363, C 11:         # «为»«便»«于»«排»«查»«，»«记»«录»«实»«际»«使»«用»«的»«模»«型»«与»«温»«度»
- L 365, C 26:             # ChatOpenAI «对»«象»«属»«性»«名»«与»«实»«现»«可»«能»«不»«同»«，»«这»«里»«仅»«用»«于»«日»«志»«展»«示»

### D:\Workspace\hackathon\src\routes.py
- L 239, C  7:     # «同»«步»«设»«置» PRICING_FILE «环»«境»«变»«量»«（»«影»«响» token_utils «计»«费»«）»
- L 246, C 15:             # «清»«除»«后»«回»«退»«到» token_utils «的»«默»«认» mapping/pricing_model.csv
- L 254, C  8: # NEW: «读»«取» CSV «为»«通»«用»«表»«格»«（»«返»«回»«列»«与»«行»«）»
- L 263, C 15:             # «去»«除»«首»«尾»«空»«白»«，»«并»«把» TRUE/FALSE «统»«一»«保»«持»«原»«值»«（»«前»«端»«已»«按»«文»«本»«展»«示»«）»
- L 276, C  5:     «返»«回»«模»«型»«参»«数»«表»«（»«从» CSV «读»«取»«）»«：»
- L 277, C  7:     - «若»«提»«供» ?source=«，»«使»«用»«该»«值»«定»«位»«文»«件»«（»«支»«持»«绝»«对»/«相»«对»«路»«径»«、».csv«、»«或»«预»«置»«名»«）»
- L 278, C  7:     - «否»«则»«优»«先»«使»«用»«当»«前» Config.pricing_model«，»«再»«回»«退»«到» mapping/pricing_model.csv
- L 279, C  5:     «响»«应»«：»
- L 284, C 11:         # «解»«析»«文»«件»«路»«径»«（»«支»«持»«预»«置»«名»«）»«，»«沿»«用»«现»«有»«解»«析»«规»«则»
- L 301, C 11:         # «始»«终»«把»“«项»«目»«根»«的» mapping/pricing_model.csv”«作»«为»«优»«先»«兜»«底»
- L 303, C 11:         # «兼»«容»«性»«兜»«底»«：»CWD «下»«的» mapping«（»«若»«有»«人»«从» src «目»«录»«启»«动»«）»
- L 418, C  5:     «双»«模»«式»«解»«析»«：»
- L 419, C  7:     - «若»«为»«绝»«对»«路»«径»«、»«包»«含»«路»«径»«分»«隔»«符»«，»«或»«以» .csv «结»«尾»«，»«则»«按»«路»«径»«处»«理»«（»«相»«对»«路»«径»«将»«相»«对»«项»«目»«根»«转»«绝»«对»«）»«。»
- L 420, C  7:     - «否»«则»«视»«为»«预»«置»«名»«，»«映»«射»«到» <project_root>/mapping/{name}.csv«。»
- L 421, C  5:     «返»«回»«解»«析»«后»«的»«绝»«对»«路»«径»«；»«无»«法»«解»«析»«时»«返»«回» None«。»
- L 429, C  7:     # «路»«径»«模»«式»
- L 433, C  7:     # «预»«置»«名»«模»«式»
- L 437, C  3: # «在» /auth/login «之»«后»«新»«增» /auth/refresh «路»«由»

### D:\Workspace\hackathon\src\streaming_service.py
- L 289, C 23:                     # «在»«批»«处»«理»/«重»«试»«的»«统»«计»«日»«志»«处»«，»«替»«换»«对» MAX_AI_MODEL «的»«使»«用»
- L 290, C 23:                     # «例»«如»«（»«示»«例»«片»«段»«）»«：»
