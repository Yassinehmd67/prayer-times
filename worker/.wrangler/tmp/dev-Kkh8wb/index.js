var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
var unenvProcess = new Process({
  env: globalProcess.env,
  // `hrtime` is only available from workerd process v2
  hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  // Always implemented by workerd
  env,
  // Only implemented in workerd v2
  hrtime: hrtime3,
  // Always implemented by workerd
  nextTick
} = unenvProcess;
var {
  _channel,
  _disconnect,
  _events,
  _eventsCount,
  _handleQueue,
  _maxListeners,
  _pendingMessage,
  _send,
  assert: assert2,
  disconnect,
  mainModule
} = unenvProcess;
var {
  // @ts-expect-error `_debugEnd` is missing typings
  _debugEnd,
  // @ts-expect-error `_debugProcess` is missing typings
  _debugProcess,
  // @ts-expect-error `_exiting` is missing typings
  _exiting,
  // @ts-expect-error `_fatalException` is missing typings
  _fatalException,
  // @ts-expect-error `_getActiveHandles` is missing typings
  _getActiveHandles,
  // @ts-expect-error `_getActiveRequests` is missing typings
  _getActiveRequests,
  // @ts-expect-error `_kill` is missing typings
  _kill,
  // @ts-expect-error `_linkedBinding` is missing typings
  _linkedBinding,
  // @ts-expect-error `_preload_modules` is missing typings
  _preload_modules,
  // @ts-expect-error `_rawDebug` is missing typings
  _rawDebug,
  // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
  _startProfilerIdleNotifier,
  // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
  _stopProfilerIdleNotifier,
  // @ts-expect-error `_tickCallback` is missing typings
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  availableMemory,
  // @ts-expect-error `binding` is missing typings
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  // @ts-expect-error `domain` is missing typings
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  // @ts-expect-error `initgroups` is missing typings
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  // @ts-expect-error `moduleLoadList` is missing typings
  moduleLoadList,
  off,
  on,
  once,
  // @ts-expect-error `openStdin` is missing typings
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  // @ts-expect-error `reallyExit` is missing typings
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = isWorkerdProcessV2 ? workerdProcess : unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/utils.js
function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
__name(corsHeaders, "corsHeaders");
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders(),
      ...headers
    }
  });
}
__name(jsonResponse, "jsonResponse");
function notFound(message = "Not Found") {
  return jsonResponse({ ok: false, error: message }, 404);
}
__name(notFound, "notFound");
function serverError(error3) {
  console.error("Server error:", error3);
  return jsonResponse({ ok: false, error: "Internal Server Error" }, 500);
}
__name(serverError, "serverError");
function handleOptions(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders(),
      status: 204
    });
  }
  return null;
}
__name(handleOptions, "handleOptions");
function extractApiKey(request) {
  const auth = request.headers.get("authorization") || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
}
__name(extractApiKey, "extractApiKey");
function daysBetween(date1, date2) {
  const diffMs = Math.abs(date1 - date2);
  return Math.floor(diffMs / (1e3 * 60 * 60 * 24));
}
__name(daysBetween, "daysBetween");
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString().split(".")[0] + "Z";
}
__name(nowIso, "nowIso");

// src/routes/geocode.js
var NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
function getCacheTtl(env2) {
  const v = env2.CACHE_TTL_LONG || "21600";
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 21600;
}
__name(getCacheTtl, "getCacheTtl");
function cacheKeyForQuery(q) {
  return "geo:" + q.trim().toLowerCase();
}
__name(cacheKeyForQuery, "cacheKeyForQuery");
async function handleGeocode(request, env2) {
  const opt = handleOptions(request);
  if (opt) return opt;
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) {
    return jsonResponse({ ok: false, error: "Missing 'q' query parameter" }, 400);
  }
  const cacheKey = cacheKeyForQuery(q);
  try {
    if (env2.PRAYER_KV) {
      const cached = await env2.PRAYER_KV.get(cacheKey);
      if (cached) {
        try {
          const json = JSON.parse(cached);
          return jsonResponse({ ...json, cached: true }, 200);
        } catch {
        }
      }
    }
    const params = new URLSearchParams({
      q,
      format: "json",
      limit: "1",
      addressdetails: "0"
    });
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        // مهم: سياسة Nominatim تتطلب User-Agent واضح
        "User-Agent": "prayer-times-app/0.1 (contact: example@example.com)"
      }
    });
    if (!res.ok) {
      return jsonResponse(
        { ok: false, error: "Upstream geocoding error", status: res.status },
        502
      );
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      const payload2 = {
        ok: false,
        query: q,
        error: "No results"
      };
      if (env2.PRAYER_KV) {
        await env2.PRAYER_KV.put(cacheKey, JSON.stringify(payload2), {
          expirationTtl: 600
          // 10 دقائق
        });
      }
      return jsonResponse(payload2, 404);
    }
    const item = data[0];
    const result = {
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      boundingbox: item.boundingbox,
      type: item.type,
      class: item.class
    };
    const payload = {
      ok: true,
      query: q,
      provider: "nominatim",
      result
    };
    if (env2.PRAYER_KV) {
      await env2.PRAYER_KV.put(cacheKey, JSON.stringify(payload), {
        expirationTtl: getCacheTtl(env2)
      });
    }
    return jsonResponse(payload, 200);
  } catch (err) {
    return serverError(err);
  }
}
__name(handleGeocode, "handleGeocode");

// src/routes/elevation.js
var ELEVATION_URL = "https://api.open-meteo.com/v1/elevation";
function getCacheTtl2(env2) {
  const v = env2.CACHE_TTL_LONG || "21600";
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 21600;
}
__name(getCacheTtl2, "getCacheTtl");
function cacheKeyForElevation(lat, lon) {
  return `elev:${lat.toFixed(4)},${lon.toFixed(4)}`;
}
__name(cacheKeyForElevation, "cacheKeyForElevation");
async function handleElevation(request, env2) {
  const opt = handleOptions(request);
  if (opt) return opt;
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }
  const url = new URL(request.url);
  const latStr = url.searchParams.get("lat");
  const lonStr = url.searchParams.get("lon");
  if (!latStr || !lonStr) {
    return jsonResponse({ ok: false, error: "Missing 'lat' or 'lon' query parameters" }, 400);
  }
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return jsonResponse({ ok: false, error: "Invalid 'lat' or 'lon' values" }, 400);
  }
  const cacheKey = cacheKeyForElevation(lat, lon);
  try {
    if (env2.PRAYER_KV) {
      const cached = await env2.PRAYER_KV.get(cacheKey);
      if (cached) {
        try {
          const json = JSON.parse(cached);
          return jsonResponse({ ...json, cached: true }, 200);
        } catch {
        }
      }
    }
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon)
    });
    const res = await fetch(`${ELEVATION_URL}?${params.toString()}`);
    if (!res.ok) {
      return jsonResponse(
        { ok: false, error: "Upstream elevation error", status: res.status },
        502
      );
    }
    const data = await res.json();
    const elevationArray = data.elevation;
    const elevation_m = Array.isArray(elevationArray) && elevationArray.length > 0 ? Number(elevationArray[0]) : null;
    if (!Number.isFinite(elevation_m)) {
      const payload2 = {
        ok: false,
        lat,
        lon,
        error: "No elevation data",
        provider: "open-meteo"
      };
      if (env2.PRAYER_KV) {
        await env2.PRAYER_KV.put(cacheKey, JSON.stringify(payload2), {
          expirationTtl: 600
          // 10 دقائق
        });
      }
      return jsonResponse(payload2, 404);
    }
    const payload = {
      ok: true,
      lat,
      lon,
      elevation_m,
      provider: "open-meteo"
    };
    if (env2.PRAYER_KV) {
      await env2.PRAYER_KV.put(cacheKey, JSON.stringify(payload), {
        expirationTtl: getCacheTtl2(env2)
      });
    }
    return jsonResponse(payload, 200);
  } catch (err) {
    return serverError(err);
  }
}
__name(handleElevation, "handleElevation");

// src/routes/weather.js
var WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
function getCacheTtl3(env2) {
  const v = env2.CACHE_TTL_SHORT || "3600";
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 3600;
}
__name(getCacheTtl3, "getCacheTtl");
function cacheKeyForWeather(lat, lon, hourly) {
  const h = (hourly || "").trim().toLowerCase() || "temperature_2m,pressure_msl";
  return `meteo:${lat.toFixed(3)},${lon.toFixed(3)}:${h}`;
}
__name(cacheKeyForWeather, "cacheKeyForWeather");
async function handleWeather(request, env2) {
  const opt = handleOptions(request);
  if (opt) return opt;
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }
  const url = new URL(request.url);
  const latStr = url.searchParams.get("lat");
  const lonStr = url.searchParams.get("lon");
  const hourly = url.searchParams.get("hourly") || "temperature_2m,pressure_msl";
  if (!latStr || !lonStr) {
    return jsonResponse({ ok: false, error: "Missing 'lat' or 'lon' query parameters" }, 400);
  }
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return jsonResponse({ ok: false, error: "Invalid 'lat' or 'lon' values" }, 400);
  }
  const cacheKey = cacheKeyForWeather(lat, lon, hourly);
  try {
    if (env2.PRAYER_KV) {
      const cached = await env2.PRAYER_KV.get(cacheKey);
      if (cached) {
        try {
          const json = JSON.parse(cached);
          return jsonResponse({ ...json, cached: true }, 200);
        } catch {
        }
      }
    }
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly,
      timezone: "auto"
    });
    const res = await fetch(`${WEATHER_URL}?${params.toString()}`);
    if (!res.ok) {
      return jsonResponse(
        { ok: false, error: "Upstream weather error", status: res.status },
        502
      );
    }
    const data = await res.json();
    const payload = {
      ok: true,
      lat,
      lon,
      provider: "open-meteo",
      data
    };
    if (env2.PRAYER_KV) {
      await env2.PRAYER_KV.put(cacheKey, JSON.stringify(payload), {
        expirationTtl: getCacheTtl3(env2)
      });
    }
    return jsonResponse(payload, 200);
  } catch (err) {
    return serverError(err);
  }
}
__name(handleWeather, "handleWeather");

// src/auth.js
var KV_KEYS = {
  key: /* @__PURE__ */ __name((apiKey) => `key:${apiKey}`, "key"),
  // بيانات المفتاح
  usage: /* @__PURE__ */ __name((apiKey, ym) => `usage:${apiKey}:${ym}`, "usage"),
  // عدّاد استخدام شهري
  coupon: /* @__PURE__ */ __name((code) => `coupon:${code}`, "coupon")
  // (اختياري) قسائم
};
async function kvGetJSON(kv, key) {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
__name(kvGetJSON, "kvGetJSON");
async function kvPutJSON(kv, key, value, options) {
  return kv.put(key, JSON.stringify(value), options);
}
__name(kvPutJSON, "kvPutJSON");
async function getKeyRecord(env2, apiKey) {
  if (!apiKey) return null;
  return kvGetJSON(env2.PRAYER_KV, KV_KEYS.key(apiKey));
}
__name(getKeyRecord, "getKeyRecord");
async function saveKeyRecord(env2, apiKey, record) {
  if (!apiKey || !record) throw new Error("Missing apiKey or record");
  await kvPutJSON(env2.PRAYER_KV, KV_KEYS.key(apiKey), record);
  return record;
}
__name(saveKeyRecord, "saveKeyRecord");
async function verifyApiKey(env2, apiKey, { requireActive = true } = {}) {
  const rec = await getKeyRecord(env2, apiKey);
  if (!rec) {
    return { ok: false, status: 401, error: "Invalid API key", code: "INVALID_KEY" };
  }
  if (requireActive && rec.is_active === false) {
    return { ok: false, status: 403, error: "Key disabled", code: "KEY_DISABLED", record: rec };
  }
  if (rec.expires_at) {
    const now = /* @__PURE__ */ new Date();
    const exp = new Date(rec.expires_at);
    if (now > exp) {
      return { ok: false, status: 403, error: "Subscription expired", code: "KEY_EXPIRED", record: rec };
    }
  }
  return { ok: true, status: 200, record: rec };
}
__name(verifyApiKey, "verifyApiKey");
async function requireApiAuth(request, env2) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return {
      authorized: false,
      response: jsonResponse({ ok: false, error: "Missing Bearer token" }, 401, {
        "WWW-Authenticate": 'Bearer realm="api", error="invalid_token"'
      })
    };
  }
  const v = await verifyApiKey(env2, apiKey, { requireActive: true });
  if (!v.ok) {
    return {
      authorized: false,
      response: jsonResponse({ ok: false, error: v.error, code: v.code }, v.status)
    };
  }
  return { authorized: true, apiKey, record: v.record };
}
__name(requireApiAuth, "requireApiAuth");
function requireAdminAuth(request, env2) {
  const hdr = request.headers.get("authorization") || "";
  if (!hdr.toLowerCase().startsWith("basic ")) {
    return {
      authorized: false,
      response: new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="admin"'
        }
      })
    };
  }
  const b64 = hdr.slice(6).trim();
  let decoded = "";
  try {
    decoded = atob(b64);
  } catch {
    return { authorized: false, response: new Response("Unauthorized", { status: 401 }) };
  }
  const [user, pass] = decoded.split(":");
  if (!env2.ADMIN_PASSWORD || pass !== env2.ADMIN_PASSWORD) {
    return { authorized: false, response: new Response("Forbidden", { status: 403 }) };
  }
  return { authorized: true, user: user || "admin" };
}
__name(requireAdminAuth, "requireAdminAuth");
async function getMonthlyUsage(env2, apiKey, ym) {
  const key = KV_KEYS.usage(apiKey, ym);
  const raw = await env2.PRAYER_KV.get(key);
  return raw ? parseInt(raw, 10) || 0 : 0;
}
__name(getMonthlyUsage, "getMonthlyUsage");
function ymNow(date = /* @__PURE__ */ new Date()) {
  return date.toISOString().slice(0, 7);
}
__name(ymNow, "ymNow");

// src/routes/usage.js
async function handleUsage(request, env2) {
  const opt = handleOptions(request);
  if (opt) return opt;
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }
  const auth = await requireApiAuth(request, env2);
  if (!auth.authorized) return auth.response;
  const { apiKey, record } = auth;
  const period = ymNow();
  const used = await getMonthlyUsage(env2, apiKey, period);
  const monthly_quota = Number(record.quota_monthly ?? env2.DEFAULT_PRO_QUOTA ?? 5e4);
  const remaining = Math.max(0, monthly_quota - used);
  let days_left = null;
  if (record.expires_at) {
    const now = /* @__PURE__ */ new Date();
    const exp = new Date(record.expires_at);
    days_left = Math.max(0, daysBetween(exp, now));
  }
  const headers = {
    "X-Plan": record.plan || "free",
    "X-Used": String(used),
    "X-Remaining": String(remaining),
    ...record.expires_at ? { "X-Expiry": record.expires_at, "X-Expiry-Days": String(days_left) } : {}
  };
  return jsonResponse(
    {
      ok: true,
      plan: record.plan || "free",
      monthly_quota,
      used,
      remaining,
      period,
      expires_at: record.expires_at || null,
      days_left
    },
    200,
    headers
  );
}
__name(handleUsage, "handleUsage");

// src/routes/admin.js
function randomKey(len = 48) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "pt_";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
__name(randomKey, "randomKey");
function addDaysIso(iso, days) {
  const d = iso ? new Date(iso) : /* @__PURE__ */ new Date();
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().split(".")[0] + "Z";
}
__name(addDaysIso, "addDaysIso");
function subpath(url) {
  const u = new URL(url);
  return u.pathname.replace(/^\/admin\/?/, "");
}
__name(subpath, "subpath");
async function handleAdmin(request, env2) {
  const opt = handleOptions(request);
  if (opt) return opt;
  const admin = requireAdminAuth(request, env2);
  if (!admin.authorized) return admin.response;
  const method = request.method;
  const path = subpath(request.url);
  try {
    if (method === "POST" && path === "keys") {
      const body = await request.json().catch(() => ({}));
      const plan = body.plan ?? "pro";
      const quota = Number(body.quota_monthly ?? env2.DEFAULT_PRO_QUOTA ?? 5e4);
      const is_active = body.is_active === false ? false : true;
      const notes = body.notes ?? "manual via admin";
      const created_at = nowIso();
      let expires_at = body.expires_at ?? null;
      const expires_in_days = body.expires_in_days ?? 30;
      if (!expires_at) {
        expires_at = addDaysIso(created_at, expires_in_days);
      }
      let key = randomKey(40);
      let exists = await env2.PRAYER_KV.get(`key:${key}`);
      if (exists) key = randomKey(44);
      const record = {
        plan,
        quota_monthly: quota,
        created_at,
        expires_at,
        is_active,
        notes
      };
      await saveKeyRecord(env2, key, record);
      return jsonResponse({ ok: true, key, record }, 201);
    }
    if (method === "PATCH" && path.startsWith("keys/")) {
      const apiKey = decodeURIComponent(path.split("/")[1] || "");
      if (!apiKey) return jsonResponse({ ok: false, error: "Missing key" }, 400);
      const current = await getKeyRecord(env2, apiKey);
      if (!current) return jsonResponse({ ok: false, error: "Key not found" }, 404);
      const body = await request.json().catch(() => ({}));
      if (body.plan !== void 0) current.plan = body.plan;
      if (body.quota_monthly !== void 0) current.quota_monthly = Number(body.quota_monthly);
      if (body.is_active !== void 0) current.is_active = !!body.is_active;
      if (body.notes !== void 0) current.notes = String(body.notes);
      if (body.expires_at) {
        current.expires_at = body.expires_at;
      } else if (body.expires_in_days !== void 0) {
        current.expires_at = addDaysIso(nowIso(), Number(body.expires_in_days));
      }
      await saveKeyRecord(env2, apiKey, current);
      return jsonResponse({ ok: true, key: apiKey, record: current }, 200);
    }
    if (method === "GET" && path.startsWith("keys/")) {
      const apiKey = decodeURIComponent(path.split("/")[1] || "");
      if (!apiKey) return jsonResponse({ ok: false, error: "Missing key" }, 400);
      const record = await getKeyRecord(env2, apiKey);
      if (!record) return jsonResponse({ ok: false, error: "Key not found" }, 404);
      return jsonResponse({ ok: true, key: apiKey, record }, 200);
    }
    if (method === "GET" && path === "search") {
      const url = new URL(request.url);
      const prefix = url.searchParams.get("prefix") || "";
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 1e3);
      const listPrefix = "key:" + prefix;
      const listed = await env2.PRAYER_KV.list({ prefix: listPrefix, limit });
      const items = [];
      for (const k of listed.keys) {
        const apiKey = k.name.replace(/^key:/, "");
        const recRaw = await env2.PRAYER_KV.get(k.name);
        if (!recRaw) continue;
        let record;
        try {
          record = JSON.parse(recRaw);
        } catch {
          continue;
        }
        items.push({ key: apiKey, record });
      }
      return jsonResponse({ ok: true, items }, 200);
    }
    return jsonResponse({ ok: false, error: "Unknown admin route" }, 404);
  } catch (err) {
    console.error("Admin route error:", err);
    return jsonResponse({ ok: false, error: "Admin handler error" }, 500);
  }
}
__name(handleAdmin, "handleAdmin");

// src/index.js
var src_default = {
  async fetch(request, env2, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, status: "healthy" }), {
        headers: { ...corsHeaders(), "content-type": "application/json" }
      });
    }
    if (pathname.startsWith("/api/geocode")) {
      return handleGeocode(request, env2);
    }
    if (pathname.startsWith("/api/elevation")) {
      return handleElevation(request, env2);
    }
    if (pathname.startsWith("/api/weather")) {
      return handleWeather(request, env2);
    }
    if (pathname.startsWith("/api/usage")) {
      return handleUsage(request, env2);
    }
    if (pathname.startsWith("/admin")) {
      return handleAdmin(request, env2);
    }
    return notFound();
  }
};
addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
});
addEventListener("error", (event) => {
  console.error("Error:", event.message);
});

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-JKHfBa/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-JKHfBa/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
