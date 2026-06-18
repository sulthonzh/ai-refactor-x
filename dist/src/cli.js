#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/tsup/assets/esm_shims.js
import path from "path";
import { fileURLToPath } from "url";
var init_esm_shims = __esm({
  "node_modules/tsup/assets/esm_shims.js"() {
    "use strict";
  }
});

// node_modules/commander/index.js
var require_commander = __commonJS({
  "node_modules/commander/index.js"(exports, module) {
    "use strict";
    init_esm_shims();
    var EventEmitter = __require("events").EventEmitter;
    var spawn = __require("child_process").spawn;
    var path2 = __require("path");
    var dirname3 = path2.dirname;
    var basename = path2.basename;
    var fs = __require("fs");
    __require("util").inherits(Command2, EventEmitter);
    exports = module.exports = new Command2();
    exports.Command = Command2;
    exports.Option = Option;
    function Option(flags, description) {
      this.flags = flags;
      this.required = flags.indexOf("<") >= 0;
      this.optional = flags.indexOf("[") >= 0;
      this.mandatory = false;
      this.negate = flags.indexOf("-no-") !== -1;
      flags = flags.split(/[ ,|]+/);
      if (flags.length > 1 && !/^[[<]/.test(flags[1])) this.short = flags.shift();
      this.long = flags.shift();
      this.description = description || "";
    }
    Option.prototype.name = function() {
      return this.long.replace(/^--/, "");
    };
    Option.prototype.attributeName = function() {
      return camelcase(this.name().replace(/^no-/, ""));
    };
    Option.prototype.is = function(arg) {
      return this.short === arg || this.long === arg;
    };
    var CommanderError = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {Number} exitCode suggested exit code which could be used with process.exit
       * @param {String} code an id string representing the error
       * @param {String} message human-readable description of the error
       * @constructor
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
      }
    };
    exports.CommanderError = CommanderError;
    function Command2(name) {
      this.commands = [];
      this.options = [];
      this._execs = /* @__PURE__ */ new Set();
      this._allowUnknownOption = false;
      this._args = [];
      this._name = name || "";
      this._optionValues = {};
      this._storeOptionsAsProperties = true;
      this._passCommandToAction = true;
      this._actionResults = [];
      this._helpFlags = "-h, --help";
      this._helpDescription = "output usage information";
      this._helpShortFlag = "-h";
      this._helpLongFlag = "--help";
    }
    Command2.prototype.command = function(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      var desc = actionOptsOrExecDesc;
      var opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      var args = nameAndArgs.split(/ +/);
      var cmd = new Command2(args.shift());
      if (desc) {
        cmd.description(desc);
        this.executables = true;
        this._execs.add(cmd._name);
        if (opts.isDefault) this.defaultExecutable = cmd._name;
      }
      cmd._noHelp = !!opts.noHelp;
      cmd._helpFlags = this._helpFlags;
      cmd._helpDescription = this._helpDescription;
      cmd._helpShortFlag = this._helpShortFlag;
      cmd._helpLongFlag = this._helpLongFlag;
      cmd._exitCallback = this._exitCallback;
      cmd._storeOptionsAsProperties = this._storeOptionsAsProperties;
      cmd._passCommandToAction = this._passCommandToAction;
      cmd._executableFile = opts.executableFile;
      this.commands.push(cmd);
      cmd.parseExpectedArgs(args);
      cmd.parent = this;
      if (desc) return this;
      return cmd;
    };
    Command2.prototype.arguments = function(desc) {
      return this.parseExpectedArgs(desc.split(/ +/));
    };
    Command2.prototype.addImplicitHelpCommand = function() {
      this.command("help [cmd]", "display help for [cmd]");
    };
    Command2.prototype.parseExpectedArgs = function(args) {
      if (!args.length) return;
      var self = this;
      args.forEach(function(arg) {
        var argDetails = {
          required: false,
          name: "",
          variadic: false
        };
        switch (arg[0]) {
          case "<":
            argDetails.required = true;
            argDetails.name = arg.slice(1, -1);
            break;
          case "[":
            argDetails.name = arg.slice(1, -1);
            break;
        }
        if (argDetails.name.length > 3 && argDetails.name.slice(-3) === "...") {
          argDetails.variadic = true;
          argDetails.name = argDetails.name.slice(0, -3);
        }
        if (argDetails.name) {
          self._args.push(argDetails);
        }
      });
      return this;
    };
    Command2.prototype.exitOverride = function(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = function(err) {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {
          }
        };
      }
      return this;
    };
    Command2.prototype._exit = function(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process.exit(exitCode);
    };
    Command2.prototype.action = function(fn) {
      var self = this;
      var listener = function(args, unknown) {
        args = args || [];
        unknown = unknown || [];
        var parsed = self.parseOptions(unknown);
        outputHelpIfRequested(self, parsed.unknown);
        self._checkForMissingMandatoryOptions();
        if (parsed.unknown.length > 0) {
          self.unknownOption(parsed.unknown[0]);
        }
        if (parsed.args.length) args = parsed.args.concat(args);
        self._args.forEach(function(arg, i) {
          if (arg.required && args[i] == null) {
            self.missingArgument(arg.name);
          } else if (arg.variadic) {
            if (i !== self._args.length - 1) {
              self.variadicArgNotLast(arg.name);
            }
            args[i] = args.splice(i);
          }
        });
        var expectedArgsCount = self._args.length;
        var actionArgs = args.slice(0, expectedArgsCount);
        if (self._passCommandToAction) {
          actionArgs[expectedArgsCount] = self;
        } else {
          actionArgs[expectedArgsCount] = self.opts();
        }
        if (args.length > expectedArgsCount) {
          actionArgs.push(args.slice(expectedArgsCount));
        }
        const actionResult = fn.apply(self, actionArgs);
        let rootCommand = self;
        while (rootCommand.parent) {
          rootCommand = rootCommand.parent;
        }
        rootCommand._actionResults.push(actionResult);
      };
      var parent = this.parent || this;
      var name = parent === this ? "*" : this._name;
      parent.on("command:" + name, listener);
      if (this._alias) parent.on("command:" + this._alias, listener);
      return this;
    };
    Command2.prototype._optionEx = function(config, flags, description, fn, defaultValue) {
      var self = this, option = new Option(flags, description), oname = option.name(), name = option.attributeName();
      option.mandatory = !!config.mandatory;
      if (typeof fn !== "function") {
        if (fn instanceof RegExp) {
          var regex = fn;
          fn = function(val, def) {
            var m = regex.exec(val);
            return m ? m[0] : def;
          };
        } else {
          defaultValue = fn;
          fn = null;
        }
      }
      if (option.negate || option.optional || option.required || typeof defaultValue === "boolean") {
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, "--");
          defaultValue = self.optionFor(positiveLongFlag) ? self._getOptionValue(name) : true;
        }
        if (defaultValue !== void 0) {
          self._setOptionValue(name, defaultValue);
          option.defaultValue = defaultValue;
        }
      }
      this.options.push(option);
      this.on("option:" + oname, function(val) {
        if (val !== null && fn) {
          val = fn(val, self._getOptionValue(name) === void 0 ? defaultValue : self._getOptionValue(name));
        }
        if (typeof self._getOptionValue(name) === "boolean" || typeof self._getOptionValue(name) === "undefined") {
          if (val == null) {
            self._setOptionValue(name, option.negate ? false : defaultValue || true);
          } else {
            self._setOptionValue(name, val);
          }
        } else if (val !== null) {
          self._setOptionValue(name, option.negate ? false : val);
        }
      });
      return this;
    };
    Command2.prototype.option = function(flags, description, fn, defaultValue) {
      return this._optionEx({}, flags, description, fn, defaultValue);
    };
    Command2.prototype.requiredOption = function(flags, description, fn, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, fn, defaultValue);
    };
    Command2.prototype.allowUnknownOption = function(arg) {
      this._allowUnknownOption = arguments.length === 0 || arg;
      return this;
    };
    Command2.prototype.storeOptionsAsProperties = function(value) {
      this._storeOptionsAsProperties = value === void 0 || value;
      if (this.options.length) {
        console.error("Commander usage error: call storeOptionsAsProperties before adding options");
      }
      return this;
    };
    Command2.prototype.passCommandToAction = function(value) {
      this._passCommandToAction = value === void 0 || value;
      return this;
    };
    Command2.prototype._setOptionValue = function(key, value) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
    };
    Command2.prototype._getOptionValue = function(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    };
    Command2.prototype.parse = function(argv) {
      if (this.executables) this.addImplicitHelpCommand();
      this.rawArgs = argv;
      this._name = this._name || basename(argv[1], ".js");
      if (this.executables && argv.length < 3 && !this.defaultExecutable) {
        argv.push(this._helpLongFlag);
      }
      var normalized = this.normalize(argv.slice(2));
      var parsed = this.parseOptions(normalized);
      var args = this.args = parsed.args;
      var result = this.parseArgs(this.args, parsed.unknown);
      if (args[0] === "help" && args.length === 1) this.help();
      if (args[0] === "help") {
        args[0] = args[1];
        args[1] = this._helpLongFlag;
      } else {
        this._checkForMissingMandatoryOptions();
      }
      var name = result.args[0];
      var subCommand = null;
      if (name) {
        subCommand = this.commands.find(function(command) {
          return command._name === name;
        });
      }
      if (!subCommand && name) {
        subCommand = this.commands.find(function(command) {
          return command.alias() === name;
        });
        if (subCommand) {
          name = subCommand._name;
          args[0] = name;
        }
      }
      if (!subCommand && this.defaultExecutable) {
        name = this.defaultExecutable;
        args.unshift(name);
        subCommand = this.commands.find(function(command) {
          return command._name === name;
        });
      }
      if (this._execs.has(name)) {
        return this.executeSubCommand(argv, args, parsed.unknown, subCommand ? subCommand._executableFile : void 0);
      }
      return result;
    };
    Command2.prototype.parseAsync = function(argv) {
      this.parse(argv);
      return Promise.all(this._actionResults);
    };
    Command2.prototype.executeSubCommand = function(argv, args, unknown, executableFile) {
      args = args.concat(unknown);
      if (!args.length) this.help();
      var isExplicitJS = false;
      var pm = argv[1];
      var bin = basename(pm, path2.extname(pm)) + "-" + args[0];
      if (executableFile != null) {
        bin = executableFile;
        var executableExt = path2.extname(executableFile);
        isExplicitJS = executableExt === ".js" || executableExt === ".ts" || executableExt === ".mjs";
      }
      var baseDir;
      var resolvedLink = fs.realpathSync(pm);
      baseDir = dirname3(resolvedLink);
      var localBin = path2.join(baseDir, bin);
      if (exists(localBin + ".js")) {
        bin = localBin + ".js";
        isExplicitJS = true;
      } else if (exists(localBin + ".ts")) {
        bin = localBin + ".ts";
        isExplicitJS = true;
      } else if (exists(localBin + ".mjs")) {
        bin = localBin + ".mjs";
        isExplicitJS = true;
      } else if (exists(localBin)) {
        bin = localBin;
      }
      args = args.slice(1);
      var proc;
      if (process.platform !== "win32") {
        if (isExplicitJS) {
          args.unshift(bin);
          args = incrementNodeInspectorPort(process.execArgv).concat(args);
          proc = spawn(process.argv[0], args, { stdio: "inherit" });
        } else {
          proc = spawn(bin, args, { stdio: "inherit" });
        }
      } else {
        args.unshift(bin);
        args = incrementNodeInspectorPort(process.execArgv).concat(args);
        proc = spawn(process.execPath, args, { stdio: "inherit" });
      }
      var signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
      signals.forEach(function(signal) {
        process.on(signal, function() {
          if (proc.killed === false && proc.exitCode === null) {
            proc.kill(signal);
          }
        });
      });
      const exitCallback = this._exitCallback;
      if (!exitCallback) {
        proc.on("close", process.exit.bind(process));
      } else {
        proc.on("close", () => {
          exitCallback(new CommanderError(process.exitCode || 0, "commander.executeSubCommandAsync", "(close)"));
        });
      }
      proc.on("error", function(err) {
        if (err.code === "ENOENT") {
          console.error("error: %s(1) does not exist, try --help", bin);
        } else if (err.code === "EACCES") {
          console.error("error: %s(1) not executable. try chmod or run with root", bin);
        }
        if (!exitCallback) {
          process.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    };
    Command2.prototype.normalize = function(args) {
      var ret = [], arg, lastOpt, index, short, opt;
      for (var i = 0, len = args.length; i < len; ++i) {
        arg = args[i];
        if (i > 0) {
          lastOpt = this.optionFor(args[i - 1]);
        }
        if (arg === "--") {
          ret = ret.concat(args.slice(i));
          break;
        } else if (lastOpt && lastOpt.required) {
          ret.push(arg);
        } else if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          short = arg.slice(0, 2);
          opt = this.optionFor(short);
          if (opt && (opt.required || opt.optional)) {
            ret.push(short);
            ret.push(arg.slice(2));
          } else {
            arg.slice(1).split("").forEach(function(c) {
              ret.push("-" + c);
            });
          }
        } else if (/^--/.test(arg) && ~(index = arg.indexOf("="))) {
          ret.push(arg.slice(0, index), arg.slice(index + 1));
        } else {
          ret.push(arg);
        }
      }
      return ret;
    };
    Command2.prototype.parseArgs = function(args, unknown) {
      var name;
      if (args.length) {
        name = args[0];
        if (this.listeners("command:" + name).length) {
          this.emit("command:" + args.shift(), args, unknown);
        } else {
          this.emit("command:*", args, unknown);
        }
      } else {
        outputHelpIfRequested(this, unknown);
        if (unknown.length > 0 && !this.defaultExecutable) {
          this.unknownOption(unknown[0]);
        }
        if (this.commands.length === 0 && this._args.filter(function(a) {
          return a.required;
        }).length === 0) {
          this.emit("command:*");
        }
      }
      return this;
    };
    Command2.prototype.optionFor = function(arg) {
      for (var i = 0, len = this.options.length; i < len; ++i) {
        if (this.options[i].is(arg)) {
          return this.options[i];
        }
      }
    };
    Command2.prototype._checkForMissingMandatoryOptions = function() {
      for (var cmd = this; cmd; cmd = cmd.parent) {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd._getOptionValue(anOption.attributeName()) === void 0) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      }
    };
    Command2.prototype.parseOptions = function(argv) {
      var args = [], len = argv.length, literal, option, arg;
      var unknownOptions = [];
      for (var i = 0; i < len; ++i) {
        arg = argv[i];
        if (literal) {
          args.push(arg);
          continue;
        }
        if (arg === "--") {
          literal = true;
          continue;
        }
        option = this.optionFor(arg);
        if (option) {
          if (option.required) {
            arg = argv[++i];
            if (arg == null) return this.optionMissingArgument(option);
            this.emit("option:" + option.name(), arg);
          } else if (option.optional) {
            arg = argv[i + 1];
            if (arg == null || arg[0] === "-" && arg !== "-") {
              arg = null;
            } else {
              ++i;
            }
            this.emit("option:" + option.name(), arg);
          } else {
            this.emit("option:" + option.name());
          }
          continue;
        }
        if (arg.length > 1 && arg[0] === "-") {
          unknownOptions.push(arg);
          if (i + 1 < argv.length && (argv[i + 1][0] !== "-" || argv[i + 1] === "-")) {
            unknownOptions.push(argv[++i]);
          }
          continue;
        }
        args.push(arg);
      }
      return { args, unknown: unknownOptions };
    };
    Command2.prototype.opts = function() {
      if (this._storeOptionsAsProperties) {
        var result = {}, len = this.options.length;
        for (var i = 0; i < len; i++) {
          var key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    };
    Command2.prototype.missingArgument = function(name) {
      const message = `error: missing required argument '${name}'`;
      console.error(message);
      this._exit(1, "commander.missingArgument", message);
    };
    Command2.prototype.optionMissingArgument = function(option, flag) {
      let message;
      if (flag) {
        message = `error: option '${option.flags}' argument missing, got '${flag}'`;
      } else {
        message = `error: option '${option.flags}' argument missing`;
      }
      console.error(message);
      this._exit(1, "commander.optionMissingArgument", message);
    };
    Command2.prototype.missingMandatoryOptionValue = function(option) {
      const message = `error: required option '${option.flags}' not specified`;
      console.error(message);
      this._exit(1, "commander.missingMandatoryOptionValue", message);
    };
    Command2.prototype.unknownOption = function(flag) {
      if (this._allowUnknownOption) return;
      const message = `error: unknown option '${flag}'`;
      console.error(message);
      this._exit(1, "commander.unknownOption", message);
    };
    Command2.prototype.variadicArgNotLast = function(name) {
      const message = `error: variadic arguments must be last '${name}'`;
      console.error(message);
      this._exit(1, "commander.variadicArgNotLast", message);
    };
    Command2.prototype.version = function(str, flags, description) {
      if (arguments.length === 0) return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      var versionOption = new Option(flags, description);
      this._versionOptionName = versionOption.long.substr(2) || "version";
      this.options.push(versionOption);
      var self = this;
      this.on("option:" + this._versionOptionName, function() {
        process.stdout.write(str + "\n");
        self._exit(0, "commander.version", str);
      });
      return this;
    };
    Command2.prototype.description = function(str, argsDescription) {
      if (arguments.length === 0) return this._description;
      this._description = str;
      this._argsDescription = argsDescription;
      return this;
    };
    Command2.prototype.alias = function(alias) {
      var command = this;
      if (this.commands.length !== 0) {
        command = this.commands[this.commands.length - 1];
      }
      if (arguments.length === 0) return command._alias;
      if (alias === command._name) throw new Error("Command alias can't be the same as its name");
      command._alias = alias;
      return this;
    };
    Command2.prototype.usage = function(str) {
      var args = this._args.map(function(arg) {
        return humanReadableArgName(arg);
      });
      var usage = "[options]" + (this.commands.length ? " [command]" : "") + (this._args.length ? " " + args.join(" ") : "");
      if (arguments.length === 0) return this._usage || usage;
      this._usage = str;
      return this;
    };
    Command2.prototype.name = function(str) {
      if (arguments.length === 0) return this._name;
      this._name = str;
      return this;
    };
    Command2.prototype.prepareCommands = function() {
      return this.commands.filter(function(cmd) {
        return !cmd._noHelp;
      }).map(function(cmd) {
        var args = cmd._args.map(function(arg) {
          return humanReadableArgName(arg);
        }).join(" ");
        return [
          cmd._name + (cmd._alias ? "|" + cmd._alias : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : ""),
          cmd._description
        ];
      });
    };
    Command2.prototype.largestCommandLength = function() {
      var commands = this.prepareCommands();
      return commands.reduce(function(max, command) {
        return Math.max(max, command[0].length);
      }, 0);
    };
    Command2.prototype.largestOptionLength = function() {
      var options = [].slice.call(this.options);
      options.push({
        flags: this._helpFlags
      });
      return options.reduce(function(max, option) {
        return Math.max(max, option.flags.length);
      }, 0);
    };
    Command2.prototype.largestArgLength = function() {
      return this._args.reduce(function(max, arg) {
        return Math.max(max, arg.name.length);
      }, 0);
    };
    Command2.prototype.padWidth = function() {
      var width = this.largestOptionLength();
      if (this._argsDescription && this._args.length) {
        if (this.largestArgLength() > width) {
          width = this.largestArgLength();
        }
      }
      if (this.commands && this.commands.length) {
        if (this.largestCommandLength() > width) {
          width = this.largestCommandLength();
        }
      }
      return width;
    };
    Command2.prototype.optionHelp = function() {
      var width = this.padWidth();
      var columns = process.stdout.columns || 80;
      var descriptionWidth = columns - width - 4;
      return this.options.map(function(option) {
        const fullDesc = option.description + (!option.negate && option.defaultValue !== void 0 ? " (default: " + JSON.stringify(option.defaultValue) + ")" : "");
        return pad(option.flags, width) + "  " + optionalWrap(fullDesc, descriptionWidth, width + 2);
      }).concat([pad(this._helpFlags, width) + "  " + optionalWrap(this._helpDescription, descriptionWidth, width + 2)]).join("\n");
    };
    Command2.prototype.commandHelp = function() {
      if (!this.commands.length) return "";
      var commands = this.prepareCommands();
      var width = this.padWidth();
      var columns = process.stdout.columns || 80;
      var descriptionWidth = columns - width - 4;
      return [
        "Commands:",
        commands.map(function(cmd) {
          var desc = cmd[1] ? "  " + cmd[1] : "";
          return (desc ? pad(cmd[0], width) : cmd[0]) + optionalWrap(desc, descriptionWidth, width + 2);
        }).join("\n").replace(/^/gm, "  "),
        ""
      ].join("\n");
    };
    Command2.prototype.helpInformation = function() {
      var desc = [];
      if (this._description) {
        desc = [
          this._description,
          ""
        ];
        var argsDescription = this._argsDescription;
        if (argsDescription && this._args.length) {
          var width = this.padWidth();
          var columns = process.stdout.columns || 80;
          var descriptionWidth = columns - width - 5;
          desc.push("Arguments:");
          desc.push("");
          this._args.forEach(function(arg) {
            desc.push("  " + pad(arg.name, width) + "  " + wrap(argsDescription[arg.name], descriptionWidth, width + 4));
          });
          desc.push("");
        }
      }
      var cmdName = this._name;
      if (this._alias) {
        cmdName = cmdName + "|" + this._alias;
      }
      var parentCmdNames = "";
      for (var parentCmd = this.parent; parentCmd; parentCmd = parentCmd.parent) {
        parentCmdNames = parentCmd.name() + " " + parentCmdNames;
      }
      var usage = [
        "Usage: " + parentCmdNames + cmdName + " " + this.usage(),
        ""
      ];
      var cmds = [];
      var commandHelp = this.commandHelp();
      if (commandHelp) cmds = [commandHelp];
      var options = [
        "Options:",
        "" + this.optionHelp().replace(/^/gm, "  "),
        ""
      ];
      return usage.concat(desc).concat(options).concat(cmds).join("\n");
    };
    Command2.prototype.outputHelp = function(cb) {
      if (!cb) {
        cb = function(passthru) {
          return passthru;
        };
      }
      const cbOutput = cb(this.helpInformation());
      if (typeof cbOutput !== "string" && !Buffer.isBuffer(cbOutput)) {
        throw new Error("outputHelp callback must return a string or a Buffer");
      }
      process.stdout.write(cbOutput);
      this.emit(this._helpLongFlag);
    };
    Command2.prototype.helpOption = function(flags, description) {
      this._helpFlags = flags || this._helpFlags;
      this._helpDescription = description || this._helpDescription;
      var splitFlags = this._helpFlags.split(/[ ,|]+/);
      if (splitFlags.length > 1) this._helpShortFlag = splitFlags.shift();
      this._helpLongFlag = splitFlags.shift();
      return this;
    };
    Command2.prototype.help = function(cb) {
      this.outputHelp(cb);
      this._exit(process.exitCode || 0, "commander.help", "(outputHelp)");
    };
    function camelcase(flag) {
      return flag.split("-").reduce(function(str, word) {
        return str + word[0].toUpperCase() + word.slice(1);
      });
    }
    function pad(str, width) {
      var len = Math.max(0, width - str.length);
      return str + Array(len + 1).join(" ");
    }
    function wrap(str, width, indent) {
      var regex = new RegExp(".{1," + (width - 1) + "}([\\s\u200B]|$)|[^\\s\u200B]+?([\\s\u200B]|$)", "g");
      var lines = str.match(regex) || [];
      return lines.map(function(line, i) {
        if (line.slice(-1) === "\n") {
          line = line.slice(0, line.length - 1);
        }
        return (i > 0 && indent ? Array(indent + 1).join(" ") : "") + line.trimRight();
      }).join("\n");
    }
    function optionalWrap(str, width, indent) {
      if (str.match(/[\n]\s+/)) return str;
      const minWidth = 40;
      if (width < minWidth) return str;
      return wrap(str, width, indent);
    }
    function outputHelpIfRequested(cmd, options) {
      options = options || [];
      for (var i = 0; i < options.length; i++) {
        if (options[i] === cmd._helpLongFlag || options[i] === cmd._helpShortFlag) {
          cmd.outputHelp();
          cmd._exit(0, "commander.helpDisplayed", "(outputHelp)");
        }
      }
    }
    function humanReadableArgName(arg) {
      var nameOutput = arg.name + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    function exists(file) {
      try {
        if (fs.statSync(file).isFile()) {
          return true;
        }
      } catch (e) {
        return false;
      }
    }
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        var result = arg;
        if (arg.indexOf("--inspect") === 0) {
          var debugOption;
          var debugHost = "127.0.0.1";
          var debugPort = "9229";
          var match;
          if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
            debugOption = match[1];
          } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
            debugOption = match[1];
            if (/^\d+$/.test(match[3])) {
              debugPort = match[3];
            } else {
              debugHost = match[3];
            }
          } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
            debugOption = match[1];
            debugHost = match[3];
            debugPort = match[4];
          }
          if (debugOption && debugPort !== "0") {
            result = `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
          }
        }
        return result;
      });
    }
  }
});

// src/cli.ts
init_esm_shims();
var import_commander = __toESM(require_commander(), 1);
import { readFile as readFile5, writeFile as writeFile3 } from "fs/promises";
import { join as join2 } from "path";

// src/index.ts
init_esm_shims();

// src/AIRefactor.ts
init_esm_shims();
import { writeFile as writeFile2 } from "fs/promises";
import { exec as exec2 } from "child_process";
import { promisify as promisify2 } from "util";

// src/AIAnalyzer.ts
init_esm_shims();
import { readFile } from "fs/promises";
import { extname } from "path";

// src/AIAnalyzerBase.ts
init_esm_shims();
var AIAnalyzerBase = class {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Initialize patterns for code analysis
   */
  getPatterns() {
    return {
      // Common anti-patterns
      antiPatterns: [
        { regex: /console\.(log|warn|error|debug)\([^)]*\)/g, category: "debug-code", severity: "low" },
        { regex: /\bTODO\s*:\s*.+/g, category: "todo", severity: "medium" },
        { regex: /\bFIXME\s*:\s*.+/g, category: "todo", severity: "high" },
        { regex: /\bHACK\s*:\s*.+/g, category: "hack", severity: "medium" },
        { regex: /\b(let|const|var)\s+(\w+)\s*=/g, category: "variable", severity: "low" }
      ],
      // Function complexity patterns
      functionPatterns: [
        { regex: /function\s+\w+\s*{[^}]{100,}/g, category: "long-function", severity: "medium" },
        { regex: /\w+\s*\([^)]*\)\s*{[^}]{100,}/g, category: "long-function", severity: "medium" },
        { regex: /if\s*\([^)]+\)\s*{[^}]*\s*if\s*\([^)]+\)/g, category: "nested-if", severity: "medium" },
        { regex: /for\s*\([^)]+\)\s*{[^}]*\s*for\s*\([^)]+\)/g, category: "nested-loop", severity: "medium" }
      ],
      // Import patterns
      importPatterns: [
        { regex: /import\s+{[^}]+}\s+from/g, category: "complex-import", severity: "low" },
        { regex: /require\([^)]+\)/g, category: "require-statement", severity: "low" },
        { regex: /from\s+['"][^'"]+['"][^;]*$/gm, category: "import-statement", severity: "low" }
      ],
      // Code quality patterns
      qualityPatterns: [
        { regex: /\b(null|undefined)\s*===?\s*\w+/g, category: "null-check", severity: "low" },
        { regex: /\b(\d+)\s*===?\s*\d+/g, category: "magic-number", severity: "low" },
        { regex: /\w+\s*=\s*\w+\s*\+\s*1/g, category: "increment", severity: "low" },
        { regex: /\.map\(\s*\w+\s*=>\s*\w+\s*\)/g, category: "simple-map", severity: "low" }
      ],
      // Performance patterns
      performancePatterns: [
        { regex: /\.forEach\(\s*\w+\s*=>\s*\w+\s*\)/g, category: "forEach-loop", severity: "low" },
        { regex: /for\s*\([^)]+\)\s*{[^}]*\.push\([^)]*\)}/g, category: "push-in-loop", severity: "medium" },
        { regex: /document\.getElementById|document\.querySelector/g, category: "dom-access", severity: "low" }
      ],
      // Security patterns
      securityPatterns: [
        { regex: /eval\([^)]*\)/g, category: "eval-statement", severity: "high" },
        { regex: /innerHTML\s*=/g, category: "innerHTML", severity: "high" },
        { regex: /document\.write/g, category: "document-write", severity: "high" },
        { regex: /\.exec\([^)]*\)/g, category: "regex-exec", severity: "low" }
      ],
      // Code duplication patterns
      duplicationPatterns: [
        { regex: /function\s+\w+\s*\([^)]*\)\s*{[^{}]*\n\s*[^{}]*\n\s*[^{}]*\n[^{}]*}/g, category: "repeated-function", severity: "medium" },
        { regex: /\{[^{}]*\n[^{}]*\n[^{}]*\n[^{}]*}/g, category: "repeated-block", severity: "medium" },
        { regex: /console\.(log|warn|error)\([^)]*\)/g, category: "repeated-console", severity: "low" }
      ]
    };
  }
  /**
   * Analyze code patterns for a specific category
   */
  analyzePattern(content, pattern) {
    const matches = [];
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      matches.push({
        pattern: pattern.regex.source,
        match: match[0],
        line: content.substring(0, match.index).split("\n").length,
        column: match.index - content.lastIndexOf("\n", match.index),
        context: this.getContext(content, match.index, 50)
      });
    }
    return {
      matches,
      count: matches.length
    };
  }
  /**
   * Get context around a match
   */
  getContext(content, index, radius) {
    const start = Math.max(0, index - radius);
    const end = Math.min(content.length, index + radius);
    return content.substring(start, end);
  }
  /**
   * Calculate pattern confidence based on frequency and context
   */
  calculateConfidence(count, context) {
    let confidence = 0.5;
    if (count > 3) confidence += 0.2;
    if (count > 5) confidence += 0.2;
    if (context.includes("function") || context.includes("class")) confidence += 0.1;
    if (context.includes("test") || context.includes("spec")) confidence -= 0.2;
    return Math.min(1, Math.max(0.1, confidence));
  }
  /**
   * Get severity level based on count and type
   */
  getSeverity(count, category) {
    if (category === "debug-code" && count > 10) return "critical";
    if (category === "eval-statement" || category === "innerHTML") return "critical";
    if (category === "long-function" && count > 5) return "high";
    if (category === "nested-loop" && count > 3) return "high";
    if (count > 5) return "high";
    if (count > 2) return "medium";
    return "low";
  }
  /**
   * Get issue suggestion based on category
   */
  getSuggestion(category) {
    const suggestions = {
      "debug-code": "Remove console statements or replace with proper logging",
      "todo": "Address the TODO/FIXME item",
      "hack": "Refactor the hack into proper code",
      "long-function": "Extract smaller functions from this large function",
      "nested-if": "Use guard clauses or extract to separate functions",
      "nested-loop": "Consider using built-in array methods or caching",
      "complex-import": "Split complex imports into multiple statements",
      "require-statement": "Use ES6 imports instead of require",
      "null-check": "Use optional chaining or nullish coalescing",
      "magic-number": "Define a constant for this magic number",
      "increment": "Use ++ operator for increment",
      "forEach-loop": "Consider using .map() or .filter() instead",
      "push-in-loop": "Pre-allocate array or use .map() instead",
      "dom-access": "Cache DOM queries or use event delegation",
      "eval-statement": "Avoid eval() for security reasons",
      "innerHTML": "Use textContent or createElement instead",
      "document-write": "Use DOM manipulation methods instead",
      "regex-exec": "Use test() for boolean checks",
      "repeated-function": "Extract repeated code into a utility function",
      "repeated-block": "Extract repeated code into a helper function",
      "repeated-console": "Replace with appropriate logging levels",
      "unused-variable": "Remove unused variable or comment it out"
    };
    return suggestions[category] || "Consider refactoring this code";
  }
  /**
   * Get issue category title
   */
  getCategoryTitle(category) {
    const titles = {
      "debug-code": "Debug Code Found",
      "todo": "Unresolved TODO/FIXME",
      "hack": "Code Hack Detected",
      "long-function": "Function Too Long",
      "nested-if": "Deeply Nested Conditionals",
      "nested-loop": "Nested Loops",
      "complex-import": "Complex Import Statement",
      "require-statement": "Legacy Require Statement",
      "null-check": "Null/Undefined Check",
      "magic-number": "Magic Number",
      "increment": "Manual Increment",
      "forEach-loop": "forEach Usage",
      "push-in-loop": "Array Push in Loop",
      "dom-access": "DOM Access",
      "eval-statement": "eval() Usage",
      "innerHTML": "innerHTML Assignment",
      "document-write": "document.write() Usage",
      "regex-exec": "Regular Expression Execution",
      "repeated-function": "Repeated Function Code",
      "repeated-block": "Repeated Code Block",
      "repeated-console": "Repeated Console Statements",
      "unused-variable": "Unused Variable"
    };
    return titles[category] || "Code Quality Issue";
  }
};

// src/AIAnalyzer.ts
var AIAnalyzer = class {
  config;
  baseAnalyzer;
  constructor(config) {
    this.config = config;
    this.baseAnalyzer = new AIAnalyzerBase(config);
  }
  /**
   * Analyze a single file and return issues
   */
  async analyzeFile(filePath) {
    const content = await readFile(filePath, "utf-8");
    const extension = extname(filePath).toLowerCase();
    if (!this.isJavaScriptFile(extension)) {
      return [];
    }
    const issues = [];
    issues.push(...await this.analyzeSyntax(content, filePath));
    issues.push(...await this.analyzePatterns(content, filePath));
    issues.push(...await this.analyzeCodeStructure(content, filePath));
    issues.push(...await this.analyzeBestPractices(content, filePath));
    return issues;
  }
  /**
   * Analyze multiple files in parallel
   */
  async analyzeFiles(files) {
    const allIssues = [];
    const promises = files.map(async (file) => {
      const issues = await this.analyzeFile(file);
      allIssues.push(...issues);
    });
    await Promise.all(promises);
    return allIssues;
  }
  /**
   * Check if file is JavaScript/TypeScript
   */
  isJavaScriptFile(extension) {
    return [".js", ".jsx", ".ts", ".tsx"].includes(extension);
  }
  /**
   * Analyze syntax issues
   */
  async analyzeSyntax(content, filePath) {
    const issues = [];
    const todoMatches = content.matchAll(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG):\s*(.+)$/gm);
    for (const match of todoMatches) {
      issues.push({
        type: "verification",
        severity: "medium",
        category: "todo",
        title: "Unresolved TODO/FIXME",
        description: `Found ${match[1]}: ${match[2]}`,
        file: filePath,
        line: content.substring(0, match.index).split("\n").length,
        column: match.index - content.lastIndexOf("\n", match.index),
        codeSnippet: match[0],
        fixable: false,
        suggestion: `Consider addressing ${match[1]}: ${match[2]}`,
        confidence: 0.8
      });
    }
    const magicNumberMatches = content.matchAll(/\b(\d+)\b(?![^\s]*%)/g);
    for (const match of magicNumberMatches) {
      const line = content.substring(0, match.index).split("\n").length;
      const lineContent = content.split("\n")[line - 1];
      if (this.isLikelyMagicNumber(lineContent, match.index)) {
        continue;
      }
      issues.push({
        type: "comprehension",
        severity: "low",
        category: "magic-number",
        title: "Magic Number",
        description: "Use named constants instead of magic numbers",
        file: filePath,
        line,
        column: match.index - content.lastIndexOf("\n", match.index),
        codeSnippet: match[0],
        fixable: true,
        suggestion: `Define a constant for ${match[0]}`,
        confidence: 0.9
      });
    }
    const functionMatches = content.matchAll(/(?:function\s+\w+\s*|\w+\s*\([^)]*\)\s*{)\s*([^{}]*\n{1,50})/g);
    for (const match of functionMatches) {
      const lines = match[1].split("\n").length;
      if (lines > 20) {
        issues.push({
          type: "architectural",
          severity: "medium",
          category: "long-function",
          title: "Function is too long",
          description: `Function has ${lines} lines, consider breaking it down`,
          file: filePath,
          line: content.substring(0, match.index).split("\n").length,
          column: match.index - content.lastIndexOf("\n", match.index),
          codeSnippet: match[0].substring(0, 200) + "...",
          fixable: true,
          suggestion: "Extract smaller functions from this large function",
          confidence: 0.85
        });
      }
    }
    return issues;
  }
  /**
   * Check if a number is likely a magic number
   */
  isLikelyMagicNumber(line, index) {
    const before = line.substring(0, index).trim();
    const after = line.substring(index + 1).trim();
    if (before.endsWith("[") && after.startsWith("]")) {
      return true;
    }
    if (before.endsWith(".") || before.endsWith("?.") || before.endsWith("?.")) {
      return true;
    }
    if (/[<>]=?==?/.test(before) || /==?<?/.test(after)) {
      return true;
    }
    if (/(\d+\.)+\d+/.test(line)) {
      return true;
    }
    return false;
  }
  /**
   * Analyze code patterns
   */
  async analyzePatterns(content, filePath) {
    const issues = [];
    const repeatedCode = await this.findRepeatedCode(content, filePath);
    issues.push(...repeatedCode);
    const complexConditionals = await this.findComplexConditionals(content, filePath);
    issues.push(...complexConditionals);
    const nestedLoops = await this.findNestedLoops(content, filePath);
    issues.push(...nestedLoops);
    return issues;
  }
  /**
   * Find repeated code blocks
   */
  async findRepeatedCode(content, filePath) {
    const issues = [];
    const lines = content.split("\n");
    const codeBlocks = /* @__PURE__ */ new Map();
    for (let i = 0; i < lines.length - 3; i++) {
      const block = lines.slice(i, i + 3).join("\n").trim();
      if (block.length > 50) {
        if (codeBlocks.has(block)) {
          codeBlocks.get(block).push(i + 1);
        } else {
          codeBlocks.set(block, [i + 1]);
        }
      }
    }
    for (const [block, lineNumbers] of codeBlocks) {
      if (lineNumbers.length > 1) {
        issues.push({
          type: "architectural",
          severity: "medium",
          category: "code-duplication",
          title: "Code duplication detected",
          description: `Found ${lineNumbers.length} similar code blocks`,
          file: filePath,
          line: lineNumbers[0],
          column: 0,
          codeSnippet: block.split("\n")[0],
          fixable: true,
          suggestion: "Extract repeated code into a function or utility",
          confidence: 0.9
        });
      }
    }
    return issues;
  }
  /**
   * Find complex conditional logic
   */
  async findComplexConditionals(content, filePath) {
    const issues = [];
    const conditionalMatches = content.matchAll(/\s+if\s*\([^)]+\)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g);
    for (const match of conditionalMatches) {
      const line = content.substring(0, match.index).split("\n").length;
      const nestingDepth = (match[0].match(/\{/g) || []).length;
      if (nestingDepth > 4) {
        issues.push({
          type: "architectural",
          severity: "medium",
          category: "complex-conditional",
          title: "Complex conditional logic",
          description: `Conditional has ${nestingDepth - 1} nesting levels`,
          file: filePath,
          line,
          column: match.index - content.lastIndexOf("\n", match.index),
          codeSnippet: match[0].substring(0, 100) + "...",
          fixable: true,
          suggestion: "Use guard clauses or extract to separate functions",
          confidence: 0.8
        });
      }
    }
    return issues;
  }
  /**
   * Find nested loops
   */
  async findNestedLoops(content, filePath) {
    const issues = [];
    const loopMatches = content.matchAll(/\s+(for|while)\s*\([^)]+\)\s*\{[^{}]*\}/g);
    const nestedLoops = [];
    let currentDepth = 0;
    for (const match of loopMatches) {
      const line = content.substring(0, match.index).split("\n").length;
      const isLoopStart = match[1].startsWith("f") || match[1].startsWith("w");
      if (isLoopStart) {
        currentDepth++;
        if (currentDepth > 2) {
          nestedLoops.push(line);
        }
      } else {
        currentDepth--;
      }
    }
    for (const line of nestedLoops) {
      issues.push({
        type: "performance",
        severity: "medium",
        category: "nested-loop",
        title: "Nested loop detected",
        description: "Deeply nested loops can impact performance",
        file: filePath,
        line,
        column: 0,
        codeSnippet: "",
        fixable: true,
        suggestion: "Consider using built-in array methods or caching",
        confidence: 0.75
      });
    }
    return issues;
  }
  /**
   * Analyze code structure issues
   */
  async analyzeCodeStructure(content, filePath) {
    const issues = [];
    const importMatches = content.matchAll(/import\s+(.+?)\s+from\s+['"](.+?)['"]/g);
    for (const match of importMatches) {
      if (match[1].split(",").length > 5) {
        issues.push({
          type: "architectural",
          severity: "low",
          category: "complex-import",
          title: "Complex import statement",
          description: "Import statement has too many named imports",
          file: filePath,
          line: content.substring(0, match.index).split("\n").length,
          column: match.index - content.lastIndexOf("\n", match.index),
          codeSnippet: match[0],
          fixable: true,
          suggestion: "Split complex imports into multiple statements",
          confidence: 0.8
        });
      }
    }
    const objectNesting = content.matchAll(/\{[^{}]*\{[^{}]*\{[^{}]*\}/g);
    for (const match of objectNesting) {
      issues.push({
        type: "comprehension",
        severity: "medium",
        category: "deep-nesting",
        title: "Deeply nested objects",
        description: "Objects have more than 2 levels of nesting",
        file: filePath,
        line: content.substring(0, match.index).split("\n").length,
        column: match.index - content.lastIndexOf("\n", match.index),
        codeSnippet: match[0].substring(0, 100) + "...",
        fixable: true,
        suggestion: "Flatten nested objects or use data classes",
        confidence: 0.7
      });
    }
    return issues;
  }
  /**
   * Analyze best practices
   */
  async analyzeBestPractices(content, filePath) {
    const issues = [];
    const consoleLogMatches = content.matchAll(/console\.(log|warn|error|debug)\([^)]*\)/g);
    for (const match of consoleLogMatches) {
      issues.push({
        type: "verification",
        severity: "low",
        category: "debug-code",
        title: "Debug code found",
        description: "Console statements should be removed from production code",
        file: filePath,
        line: content.substring(0, match.index).split("\n").length,
        column: match.index - content.lastIndexOf("\n", match.index),
        codeSnippet: match[0],
        fixable: true,
        suggestion: "Remove console statements or replace with proper logging",
        confidence: 0.9
      });
    }
    const unusedVars = await this.findUnusedVariables(content, filePath);
    issues.push(...unusedVars);
    return issues;
  }
  /**
   * Find unused variables
   */
  async findUnusedVariables(content, filePath) {
    const issues = [];
    const variableMatches = content.matchAll(/(?:let|const|var)\s+(\w+)/g);
    const definedVars = /* @__PURE__ */ new Set();
    const usedVars = /* @__PURE__ */ new Set();
    for (const match of variableMatches) {
      const varName = match[1];
      if (!/\w+\s*\([^)]*\)\s*\{/.test(content.substring(0, match.index))) {
        definedVars.add(varName);
      }
    }
    const usageMatches = content.matchAll(/\b(\w+)\b/g);
    for (const match of usageMatches) {
      usedVars.add(match[1]);
    }
    for (const varName of definedVars) {
      if (!usedVars.has(varName)) {
        const line = content.substring(0, content.indexOf(varName, content.search(varName))).split("\n").length;
        issues.push({
          type: "verification",
          severity: "low",
          category: "unused-variable",
          title: "Unused variable",
          description: `Variable '${varName}' is defined but never used`,
          file: filePath,
          line,
          column: 0,
          codeSnippet: `const ${varName}`,
          fixable: true,
          suggestion: `Remove unused variable '${varName}'`,
          confidence: 0.8
        });
      }
    }
    return issues;
  }
};

// src/AIFixer.ts
init_esm_shims();
import { readFile as readFile2, writeFile } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
var AIFixer = class {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Generate a refactoring suggestion for a specific issue
   */
  async generateSuggestion(issue, projectPath) {
    const id = this.generateId();
    const context = await this.getCodeContext(issue, projectPath);
    const beforeCode = context;
    let afterCode = beforeCode;
    let explanation = "";
    let suggestedChanges = [];
    switch (issue.category) {
      case "magic-number":
        ({ afterCode, explanation, suggestedChanges } = await this.fixMagicNumber(issue, context));
        break;
      case "long-function":
        ({ afterCode, explanation, suggestedChanges } = await this.fixLongFunction(issue, context));
        break;
      case "code-duplication":
        ({ afterCode, explanation, suggestedChanges } = await this.fixCodeDuplication(issue, context));
        break;
      case "complex-conditional":
        ({ afterCode, explanation, suggestedChanges } = await this.fixComplexConditional(issue, context));
        break;
      case "nested-loop":
        ({ afterCode, explanation, suggestedChanges } = await this.fixNestedLoop(issue, context));
        break;
      case "debug-code":
        ({ afterCode, explanation, suggestedChanges } = await this.fixDebugCode(issue, context));
        break;
      case "unused-variable":
        ({ afterCode, explanation, suggestedChanges } = await this.fixUnusedVariable(issue, context));
        break;
      case "complex-import":
        ({ afterCode, explanation, suggestedChanges } = await this.fixComplexImport(issue, context));
        break;
      case "null-check":
        ({ afterCode, explanation, suggestedChanges } = await this.fixNullCheck(issue, context));
        break;
      default:
        ({ afterCode, explanation, suggestedChanges } = await this.generateGenericFix(issue, context));
    }
    const estimatedSavings = this.calculateSavings(beforeCode, afterCode);
    return {
      id,
      issue,
      beforeCode,
      afterCode,
      explanation,
      changes: suggestedChanges,
      confidence: issue.confidence,
      estimatedSavings
    };
  }
  /**
   * Apply a refactoring suggestion to the actual file
   */
  async applySuggestion(suggestion, options) {
    const { issue, changes } = suggestion;
    const filePath = issue.file;
    const currentContent = await readFile2(filePath, "utf-8");
    const lines = currentContent.split("\n");
    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];
      await this.applyFileChange(change, lines, options);
    }
    const newContent = lines.join("\n");
    await writeFile(filePath, newContent);
  }
  /**
   * Generate a unique ID for a suggestion
   */
  generateId() {
    return `fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Get code context around an issue
   */
  async getCodeContext(issue, projectPath) {
    try {
      const fullContent = await readFile2(issue.file, "utf-8");
      const lines = fullContent.split("\n");
      const startLine = Math.max(0, issue.line - 3);
      const endLine = Math.min(lines.length, issue.line + 3);
      const contextLines = lines.slice(startLine, endLine);
      return contextLines.join("\n");
    } catch (error) {
      return `// Error reading file: ${error.message}
`;
    }
  }
  /**
   * Fix magic numbers by replacing with named constants
   */
  async fixMagicNumber(issue, context) {
    const magicNumberMatch = context.match(/\b(\d+)\b/);
    if (!magicNumberMatch) {
      return this.generateGenericFix(issue, context);
    }
    const magicNumber = magicNumberMatch[0];
    const constantName = this.constantNameForNumber(magicNumber);
    const explanation = `Replace magic number ${magicNumber} with constant ${constantName}`;
    const afterCode = context.replace(new RegExp(`\\b${magicNumber}\\b`, "g"), constantName);
    const suggestedChanges = [{
      file: issue.file,
      operation: "insert",
      line: Math.max(1, issue.line - 2),
      content: `const ${constantName} = ${magicNumber}; // Magic number extracted`,
      description: "Add named constant for magic number"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Generate a constant name for a number
   */
  constantNameForNumber(number) {
    if (number === "1000") return "DEFAULT_TIMEOUT";
    if (number === "100") return "MAX_RETRIES";
    if (number === "5000") return "CACHE_SIZE";
    if (number === "200") return "MAX_CONNECTIONS";
    if (number === "30000") return "DEFAULT_DELAY";
    return `CONST_${number.toUpperCase()}`;
  }
  /**
   * Fix long functions by extracting smaller functions
   */
  async fixLongFunction(issue, context) {
    const functionNameMatch = context.match(/(?:function\s+(\w+)|(\w+)\s*\([^)]*\))/);
    const functionName = functionNameMatch ? functionNameMatch[1] || functionNameMatch[2] : "extracted";
    const explanation = `Extract part of the long function into a smaller function "${functionName}Extracted"`;
    const lines = context.split("\n");
    const extractedFunction = lines.slice(1, 4).join("\n");
    const afterCode = context.replace(extractedFunction, "");
    const suggestedChanges = [{
      file: issue.file,
      operation: "insert",
      line: Math.max(1, issue.line - 1),
      content: `
function ${functionName}Extracted() {
${extractedFunction}
}`,
      description: `Extract function ${functionName}Extracted from long function`
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix code duplication by extracting to a common function
   */
  async fixCodeDuplication(issue, context) {
    const explanation = "Extract duplicated code into a common utility function";
    const functionName = `extractedFunction${Date.now()}`;
    const functionCode = context.trim();
    const afterCode = context.replace(functionCode, `// Call ${functionName}() here`);
    const suggestedChanges = [{
      file: issue.file,
      operation: "insert",
      line: 1,
      content: `function ${functionName}() {
${functionCode}
}
`,
      description: `Extract duplicated code into ${functionName}()`
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix complex conditionals by using guard clauses
   */
  async fixComplexConditional(issue, context) {
    const explanation = "Refactor complex conditional using guard clauses";
    const conditionalMatch = context.match(/if\s*\(([^)]+)\)\s*\{([^}]*)\}/);
    if (!conditionalMatch) {
      return this.generateGenericFix(issue, context);
    }
    const condition = conditionalMatch[1];
    const body = conditionalMatch[2];
    const afterCode = `if (!${condition}) return;
${body}`;
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Replace complex conditional with guard clause"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix nested loops by using built-in methods
   */
  async fixNestedLoop(issue, context) {
    const explanation = "Replace nested loop with built-in array methods";
    const nestedLoopMatch = context.match(/for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)/);
    if (!nestedLoopMatch) {
      return this.generateGenericFix(issue, context);
    }
    const afterCode = context.replace(
      /for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)/,
      "array.flatMap()"
    );
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Replace nested loop with flatMap"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Remove debug code (console statements)
   */
  async fixDebugCode(issue, context) {
    const explanation = "Remove console.debug statement";
    const afterCode = context.replace(/console\.(log|warn|error|debug)\([^)]*\);\s*\n?/g, "");
    const suggestedChanges = [{
      file: issue.file,
      operation: "delete",
      line: issue.line,
      content: "",
      description: "Remove console statement"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Remove unused variables
   */
  async fixUnusedVariable(issue, context) {
    const explanation = "Remove unused variable";
    const varMatch = context.match(/(?:let|const|var)\s+(\w+)/);
    if (!varMatch) {
      return this.generateGenericFix(issue, context);
    }
    const varName = varMatch[1];
    const afterCode = context.replace(new RegExp(`\\b(let|const|var)\\s+${varName}\\s*[=;].*`, "g"), "");
    const suggestedChanges = [{
      file: issue.file,
      operation: "delete",
      line: issue.line,
      content: "",
      description: `Remove unused variable ${varName}`
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix complex imports by splitting them
   */
  async fixComplexImport(issue, context) {
    const explanation = "Split complex import into multiple statements";
    const importMatch = context.match(/import\s+{([^}]+)}\s+from/);
    if (!importMatch) {
      return this.generateGenericFix(issue, context);
    }
    const imports = importMatch[1].split(",").map((i) => i.trim());
    const firstImport = imports[0];
    const afterCode = context.replace(
      /import\s+{[^}]+}\s+from/,
      `import ${firstImport} from`
    );
    const additionalImports = imports.slice(1).map(
      (imp) => `import ${imp} from '${context.match(/from\s+['"]([^'"]+)['"]/)?.[1] || "module"}'`
    ).join("\n");
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Split complex import statement"
    }, {
      file: issue.file,
      operation: "insert",
      line: issue.line + 1,
      content: additionalImports,
      description: "Add remaining imports"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix null checks by using optional chaining
   */
  async fixNullCheck(issue, context) {
    const explanation = "Replace null check with optional chaining";
    const nullCheckMatch = context.match(/null\s*===?\s*(\w+)/);
    if (!nullCheckMatch) {
      return this.generateGenericFix(issue, context);
    }
    const variable = nullCheckMatch[1];
    const afterCode = context.replace(
      /null\s*===?\s*(\w+)/,
      `${variable}?.`
    );
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Replace null check with optional chaining"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Generate a generic fix for unknown issue types
   */
  async generateGenericFix(issue, context) {
    const explanation = "Generic refactoring suggestion";
    const afterCode = context.replace(issue.codeSnippet, "// TODO: Refactor this code");
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Generic placeholder for refactoring"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Calculate estimated savings from a refactoring
   */
  calculateSavings(beforeCode, afterCode) {
    const beforeLines = beforeCode.split("\n").length;
    const afterLines = afterCode.split("\n").length;
    const beforeChars = beforeCode.length;
    const afterChars = afterCode.length;
    const linesSaved = Math.max(0, beforeLines - afterLines);
    const charsSaved = Math.max(0, beforeChars - afterChars);
    const percentage = beforeLines > 0 ? Math.round(linesSaved / beforeLines * 100) : 0;
    return {
      lines: linesSaved,
      characters: charsSaved,
      percentage
    };
  }
  /**
   * Apply a file change to the lines array
   */
  async applyFileChange(change, lines, options) {
    const { file, operation, line, content, description } = change;
    switch (operation) {
      case "insert":
        lines.splice(line - 1, 0, content);
        if (options.verbose) {
          console.log(`\u2713 Inserted in ${file}: ${description}`);
        }
        break;
      case "delete":
        if (lines[line - 1]) {
          lines.splice(line - 1, 1);
          if (options.verbose) {
            console.log(`\u2713 Deleted from ${file}: ${description}`);
          }
        }
        break;
      case "replace":
        if (lines[line - 1]) {
          lines.splice(line - 1, 1, content);
          if (options.verbose) {
            console.log(`\u2713 Replaced in ${file}: ${description}`);
          }
        }
        break;
    }
  }
};

// src/FileProcessor.ts
init_esm_shims();
import { readdir, readFile as readFile3, stat as stat2 } from "fs/promises";
import { join, extname as extname2, relative } from "path";
var FileProcessor = class {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Find all files to analyze based on config patterns
   */
  async findFiles(rootPath) {
    const files = [];
    const processedDirs = /* @__PURE__ */ new Set();
    const patterns = this.config.patterns || ["**/*.{js,ts,jsx,tsx}"];
    const ignorePatterns = this.config.ignore || [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/.git/**",
      "**/.next/**",
      "**/.nuxt/**",
      "**/coverage/**",
      "**/logs/**"
    ];
    for (const pattern of patterns) {
      const foundFiles = await this.findFilesByPattern(rootPath, pattern, ignorePatterns);
      files.push(...foundFiles);
    }
    const uniqueFiles = Array.from(new Set(files));
    if (this.config.maxFiles && uniqueFiles.length > this.config.maxFiles) {
      uniqueFiles.splice(this.config.maxFiles);
    }
    return uniqueFiles;
  }
  /**
   * Find files matching a specific pattern
   */
  async findFilesByPattern(rootPath, pattern, ignorePatterns) {
    const files = [];
    if (pattern.includes("**") || pattern.includes("*")) {
      await this.walkDirectory(rootPath, pattern, ignorePatterns, files);
    } else {
      const files2 = await this.findFilesByExtension(rootPath, pattern, ignorePatterns);
    }
    return files;
  }
  /**
   * Walk directory and collect files matching pattern
   */
  async walkDirectory(dir, pattern, ignorePatterns, files, currentDepth = 0) {
    if (currentDepth >= (this.config.depth || 10)) {
      return;
    }
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(process.cwd(), fullPath);
        if (this.shouldIgnorePath(relativePath, ignorePatterns)) {
          continue;
        }
        if (entry.isDirectory()) {
          await this.walkDirectory(fullPath, pattern, ignorePatterns, files, currentDepth + 1);
        } else if (entry.isFile() && this.matchesPattern(fullPath, pattern)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}: ${error.message}`);
    }
  }
  /**
   * Find files by specific extension
   */
  async findFilesByExtension(rootPath, extension, ignorePatterns) {
    const files = [];
    try {
      const entries = await readdir(rootPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(rootPath, entry.name);
        const relativePath = relative(process.cwd(), fullPath);
        if (this.shouldIgnorePath(relativePath, ignorePatterns)) {
          continue;
        }
        if (entry.isDirectory()) {
          const subFiles = await this.findFilesByExtension(fullPath, extension, ignorePatterns);
          files.push(...subFiles);
        } else if (entry.isFile() && extname2(fullPath) === extension) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${rootPath}: ${error.message}`);
    }
    return files;
  }
  /**
   * Check if a path should be ignored based on ignore patterns
   */
  shouldIgnorePath(path2, ignorePatterns) {
    for (const pattern of ignorePatterns) {
      if (this.matchesPattern(path2, pattern)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Check if a path matches a pattern
   */
  matchesPattern(path2, pattern) {
    if (!pattern.includes("*") && !pattern.includes("?") && !pattern.includes("[") && !pattern.includes("{")) {
      return path2 === pattern || path2.endsWith(pattern);
    }
    const regexPattern = this.globToRegex(pattern);
    const regex = new RegExp(regexPattern);
    return regex.test(path2);
  }
  /**
   * Convert glob pattern to regex
   */
  globToRegex(glob) {
    let regex = glob;
    regex = regex.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    regex = regex.replace(/\*\*/g, ".*");
    regex = regex.replace(/\*/g, "[^/]*");
    regex = regex.replace(/\?/g, "[^/]");
    regex = regex.replace(/\{([^}]+)\}/g, "(?:$1)");
    return `^${regex}$`;
  }
  /**
   * Read file content with error handling
   */
  async readFileContent(filePath) {
    try {
      const content = await readFile3(filePath, "utf-8");
      return content;
    } catch (error) {
      throw new Error(`Could not read file ${filePath}: ${error.message}`);
    }
  }
  /**
   * Get file statistics
   */
  async getFileStats(filePath) {
    try {
      const stats = await stat2(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    } catch (error) {
      throw new Error(`Could not get stats for ${filePath}: ${error.message}`);
    }
  }
  /**
   * Analyze file for patterns
   */
  async analyzePatterns(filePath) {
    const content = await this.readFileContent(filePath);
    const patterns = [];
    const patternDefinitions = [
      { regex: /import\s+{[^}]+}\s+from/g, type: "code" },
      { regex: /require\([^)]+\)/g, type: "code" },
      { regex: /console\.[\w]+\([^)]*\)/g, type: "code" },
      { regex: /TODO\s*:\s*/gm, type: "comment" },
      { regex: /FIXME\s*:\s*/gm, type: "comment" },
      { regex: /\bfunction\s+\w+\s*\(/g, type: "code" },
      { regex: /\b(class|interface|type)\s+\w+/g, type: "code" },
      { regex: /\b(let|const|var)\s+\w+/g, type: "code" },
      { regex: /\/\*[\s\S]*?\*\//g, type: "comment" },
      { regex: /\/\/.*$/gm, type: "comment" },
      { regex: /['"`][^'"`]*['"`]/g, type: "string" }
    ];
    for (const patternDef of patternDefinitions) {
      let match;
      while ((match = patternDef.regex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split("\n").length;
        const column = match.index - content.lastIndexOf("\n", match.index);
        patterns.push({
          file: filePath,
          matches: [{
            pattern: patternDef.regex.source,
            match: match[0],
            line,
            column,
            context: this.getContext(content, match.index, 50)
          }],
          type: patternDef.type
        });
      }
    }
    return patterns;
  }
  /**
   * Get context around a position
   */
  getContext(content, index, radius) {
    const start = Math.max(0, index - radius);
    const end = Math.min(content.length, index + radius);
    return content.substring(start, end);
  }
  /**
   * Get file information
   */
  async getFileInfo(filePath) {
    const stats = await this.getFileStats(filePath);
    const content = await this.readFileContent(filePath);
    const extension = extname2(filePath);
    const lines = content.split("\n").length;
    const hasTests = filePath.includes(".test.") || filePath.includes(".spec.");
    const hasTypeScript = [".ts", ".tsx"].includes(extension);
    const complexity = this.estimateComplexity(content);
    return {
      path: filePath,
      relativePath: relative(process.cwd(), filePath),
      extension,
      size: stats.size,
      lines,
      hasTests,
      hasTypeScript,
      complexity
    };
  }
  /**
   * Estimate code complexity
   */
  estimateComplexity(content) {
    let complexity = 1;
    const controlStructures = content.match(/\b(if|for|while|switch|case|try|catch)\b/g);
    if (controlStructures) {
      complexity += controlStructures.length;
    }
    const functions = content.match(/\b(function\s+\w+|\w+\s*\([^)]*\)\s*{|class\s+\w+)/g);
    if (functions) {
      complexity += functions.length;
    }
    const nestingMatches = content.match(/{/g);
    const maxNesting = nestingMatches ? nestingMatches.length / 10 : 0;
    complexity += maxNesting;
    return Math.round(complexity);
  }
  /**
   * Batch process multiple files
   */
  async batchProcess(filePaths) {
    const files = [];
    const errors = [];
    let processed = 0;
    let skipped = 0;
    for (const filePath of filePaths) {
      try {
        const fileInfo = await this.getFileInfo(filePath);
        const patterns = await this.analyzePatterns(filePath);
        files.push({
          ...fileInfo,
          patterns,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        processed++;
      } catch (error) {
        errors.push(`Error processing ${filePath}: ${error.message}`);
        skipped++;
      }
    }
    return { files, errors, processed, skipped };
  }
  /**
   * Create backup of files
   */
  async createBackup(filePaths, backupDir) {
    const backupFiles = [];
    try {
      const { mkdir: mkdir4 } = await import("fs/promises");
      await mkdir4(backupDir, { recursive: true });
    } catch (error) {
    }
    for (const filePath of filePaths) {
      try {
        const relativePath = relative(process.cwd(), filePath);
        const backupPath = join(backupDir, relativePath);
        const backupDirPath = dirname(backupPath);
        await mkdir(backupDirPath, { recursive: true });
        const { copyFile: copyFile2 } = await import("fs/promises");
        await copyFile2(filePath, backupPath);
        backupFiles.push(backupPath);
      } catch (error) {
        console.warn(`Could not backup ${filePath}: ${error.message}`);
      }
    }
    return backupFiles;
  }
};

// src/OutputFormatter.ts
init_esm_shims();
var OutputFormatter = class {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Format analysis result based on configured output format
   */
  formatReport(result) {
    switch (this.config.outputFormat) {
      case "json":
        return this.formatJSON(result);
      case "markdown":
        return this.formatMarkdown(result);
      case "console":
      default:
        return this.formatConsole(result);
    }
  }
  /**
   * Format analysis result as JSON
   */
  formatJSON(result) {
    const report = {
      metadata: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        totalFiles: result.totalFiles,
        totalIssues: result.summary.totalIssues,
        fixableIssues: result.summary.fixableIssues,
        criticalIssues: result.summary.criticalIssues,
        estimatedSavings: result.summary.estimatedSavings,
        estimatedTime: result.summary.estimatedTime
      },
      issues: result.issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        file: issue.file,
        line: issue.line,
        category: issue.category,
        severity: issue.severity,
        confidence: issue.confidence,
        fixable: issue.fixable,
        code: issue.codeSnippet,
        description: issue.description,
        suggestion: issue.suggestion
      })),
      suggestions: result.suggestions.map((suggestion) => ({
        id: suggestion.id,
        issueId: suggestion.issue.id,
        title: suggestion.issue.title,
        file: suggestion.issue.file,
        line: suggestion.issue.line,
        beforeCode: suggestion.beforeCode,
        afterCode: suggestion.afterCode,
        explanation: suggestion.explanation,
        changes: suggestion.changes,
        confidence: suggestion.confidence,
        estimatedSavings: suggestion.estimatedSavings
      })),
      warnings: result.warnings,
      errors: result.errors
    };
    return JSON.stringify(report, null, 2);
  }
  /**
   * Format analysis result as Markdown
   */
  formatMarkdown(result) {
    let markdown = `# AI Refactor Report

`;
    markdown += `Generated: ${(/* @__PURE__ */ new Date()).toISOString()}
`;
    markdown += `Files analyzed: ${result.totalFiles}

`;
    markdown += `## Summary

`;
    markdown += `- Total Issues: ${result.summary.totalIssues}
`;
    markdown += `- Fixable Issues: ${result.summary.fixableIssues}
`;
    markdown += `- Critical Issues: ${result.summary.criticalIssues}
`;
    markdown += `- Potential Savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)
`;
    markdown += `- Estimated Time: ${result.summary.estimatedTime}

`;
    const issuesByCategory = result.issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {});
    markdown += `## Issues by Category

`;
    Object.entries(issuesByCategory).sort(([, a], [, b]) => b - a).forEach(([category, count]) => {
      markdown += `- ${category}: ${count}
`;
    });
    markdown += "\n";
    if (result.issues.length > 0) {
      markdown += `## Detailed Issues

`;
      for (const issue of result.issues.slice(0, 10)) {
        markdown += `### ${issue.title}

`;
        markdown += `- **File:** ${issue.file}:${issue.line}
`;
        markdown += `- **Category:** ${issue.category}
`;
        markdown += `- **Severity:** ${issue.severity}
`;
        markdown += `- **Confidence:** ${Math.round(issue.confidence * 100)}%
`;
        markdown += `- **Fixable:** ${issue.fixable ? "Yes" : "No"}

`;
        if (issue.description) {
          markdown += `**Description:** ${issue.description}

`;
        }
        if (issue.codeSnippet) {
          markdown += `\`\`\`
${issue.codeSnippet}
\`\`\`

`;
        }
        if (issue.suggestion) {
          markdown += `**Suggestion:** ${issue.suggestion}

`;
        }
        if (issue.fixable) {
          markdown += `\u{1F527} **Fixable:** Yes

`;
        } else {
          markdown += `\u26A0\uFE0F **Requires manual review**

`;
        }
        markdown += `---

`;
      }
      if (result.issues.length > 10) {
        markdown += `... and ${result.issues.length - 10} more issues

`;
      }
    }
    if (result.suggestions.length > 0) {
      markdown += `## Refactoring Suggestions

`;
      for (const suggestion of result.suggestions.slice(0, 5)) {
        markdown += `### ${suggestion.issue.title}

`;
        markdown += `- **File:** ${suggestion.issue.file}:${suggestion.issue.line}
`;
        markdown += `- **Category:** ${suggestion.issue.category}
`;
        markdown += `- **Savings:** ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)
`;
        markdown += `- **Confidence:** ${Math.round(suggestion.confidence * 100)}%

`;
        if (suggestion.explanation) {
          markdown += `**Explanation:** ${suggestion.explanation}

`;
        }
        if (suggestion.beforeCode && suggestion.afterCode) {
          markdown += `**Before:**
\`\`\`
${suggestion.beforeCode}
\`\`\`

`;
          markdown += `**After:**
\`\`\`
${suggestion.afterCode}
\`\`\`

`;
        }
        markdown += `---

`;
      }
      if (result.suggestions.length > 5) {
        markdown += `... and ${result.suggestions.length - 5} more suggestions

`;
      }
    }
    if (result.warnings.length > 0) {
      markdown += `## Warnings

`;
      result.warnings.forEach((warning) => {
        markdown += `- ${warning}
`;
      });
      markdown += "\n";
    }
    if (result.errors.length > 0) {
      markdown += `## Errors

`;
      result.errors.forEach((error) => {
        markdown += `- ${error}
`;
      });
      markdown += "\n";
    }
    return markdown;
  }
  /**
   * Format analysis result for console output
   */
  formatConsole(result) {
    let output = "";
    output += "\u{1F50D} AI Refactor Analysis Report\n";
    output += "=".repeat(30) + "\n";
    output += `\u{1F4C1} Files analyzed: ${result.totalFiles}
`;
    output += `\u{1F50D} Issues found: ${result.summary.totalIssues}
`;
    output += `\u{1F527} Fixable issues: ${result.summary.fixableIssues}
`;
    output += `\u{1F680} Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)
`;
    output += `\u23F1\uFE0F  Estimated time: ${result.summary.estimatedTime}

`;
    if (result.issues.length > 0) {
      const issuesByCategory = result.issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {});
      output += "\u{1F4CA} Issues by Category:\n";
      Object.entries(issuesByCategory).sort(([, a], [, b]) => b - a).forEach(([category, count]) => {
        output += `  \u2022 ${category}: ${count}
`;
      });
      output += "\n";
    }
    if (result.issues.length > 0) {
      output += "\u26A0\uFE0F Top Issues:\n";
      output += "-".repeat(12) + "\n";
      for (const issue of result.issues.slice(0, 5)) {
        output += `  ${issue.severity.toUpperCase()} - ${issue.title}
`;
        output += `    ${issue.file}:${issue.line} (${issue.category})
`;
        if (issue.description) {
          output += `    ${issue.description}
`;
        }
        output += "\n";
      }
      if (result.issues.length > 5) {
        output += `  ... and ${result.issues.length - 5} more issues

`;
      }
    }
    if (result.suggestions.length > 0) {
      output += "\u{1F4A1} Refactoring Suggestions:\n";
      output += "-".repeat(24) + "\n";
      for (const suggestion of result.suggestions.slice(0, 3)) {
        output += `  ${suggestion.issue.title}
`;
        output += `    ${suggestion.issue.file}:${suggestion.issue.line}
`;
        output += `    ${suggestion.explanation}
`;
        output += `    Savings: ${suggestion.estimatedSavings.lines} lines
`;
        output += "    Apply: ai-refactor-x refactor --fix\n";
        output += "    Preview: ai-refactor-x suggest\n\n";
      }
      if (result.suggestions.length > 3) {
        output += `  ... and ${result.suggestions.length - 3} more suggestions

`;
      }
    }
    output += "\u{1F3AF} Recommendations:\n";
    output += "  ai-refactor-x refactor --fix\n";
    output += "  ai-refactor-x fix\n\n";
    if (result.suggestions.length > 0) {
      output += "To preview fixes, use:\n";
      output += "  ai-refactor-x suggest\n\n";
    }
    output += "For more help: ai-refactor-x --help\n";
    return output;
  }
};

// src/AIRefactor.ts
var execAsync2 = promisify2(exec2);
var AIRefactor = class {
  config;
  analyzer;
  fixer;
  fileProcessor;
  formatter;
  constructor(config = {}) {
    this.config = {
      patterns: ["**/*.{js,ts,jsx,tsx}"],
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/*.test.*", "**/*.spec.*"],
      depth: 10,
      maxFiles: 1e3,
      outputFormat: "console",
      aiProvider: "openai",
      model: "gpt-4",
      ...config
    };
    this.analyzer = new AIAnalyzer(this.config);
    this.fixer = new AIFixer(this.config);
    this.fileProcessor = new FileProcessor(this.config);
    this.formatter = new OutputFormatter(this.config);
  }
  /**
   * Analyze code in directory and return issues
   */
  async analyze(path2, config) {
    const finalConfig = { ...this.config, ...config };
    const files = await this.fileProcessor.findFiles(path2);
    const issues = [];
    const warnings = [];
    const errors = [];
    for (const file of files) {
      try {
        const fileIssues = await this.analyzer.analyzeFile(file);
        issues.push(...fileIssues);
      } catch (error) {
        const message = `Error analyzing ${file}: ${error.message}`;
        errors.push(message);
        warnings.push(`Skipped ${file} due to error`);
      }
    }
    const suggestions = [];
    const fixableIssues = issues.filter((issue) => issue.fixable);
    for (const issue of fixableIssues) {
      try {
        const suggestion = await this.fixer.generateSuggestion(issue, path2);
        suggestions.push(suggestion);
      } catch (error) {
        warnings.push(`Could not generate fix for ${issue.title}: ${error.message}`);
      }
    }
    const summary = this.calculateSummary(issues, suggestions);
    return {
      files,
      totalFiles: files.length,
      issues,
      suggestions,
      summary,
      warnings,
      errors
    };
  }
  /**
   * Apply refactoring fixes
   */
  async refactor(path2, options = {}) {
    const finalOptions = {
      fix: false,
      interactive: true,
      backup: true,
      dryRun: false,
      output: "",
      verbose: false,
      yes: false,
      ...options
    };
    const result = await this.analyze(path2);
    if (finalOptions.dryRun) {
      return result;
    }
    if (finalOptions.backup) {
      await this.createBackup(path2);
    }
    if (finalOptions.fix) {
      await this.applyFixes(result.suggestions, finalOptions);
    }
    return result;
  }
  /**
   * Fix specific issues
   */
  async fix(path2, issues) {
    if (!issues) {
      const analysis = await this.analyze(path2);
      issues = analysis.issues.filter((issue) => issue.fixable);
    }
    const result = {
      files: [],
      totalFiles: 0,
      issues,
      suggestions: [],
      summary: this.calculateSummary(issues, []),
      warnings: [],
      errors: []
    };
    await this.applyFixes(result.suggestions, { fix: true, backup: true, dryRun: false, verbose: true, interactive: false, output: "", yes: true });
    return result;
  }
  /**
   * Generate refactoring suggestions
   */
  async suggest(path2, issues) {
    if (!issues) {
      const analysis = await this.analyze(path2);
      issues = analysis.issues.filter((issue) => issue.fixable);
    }
    const suggestions = [];
    for (const issue of issues) {
      try {
        const suggestion = await this.fixer.generateSuggestion(issue, path2);
        suggestions.push(suggestion);
      } catch (error) {
        console.warn(`Could not generate suggestion for ${issue.title}: ${error.message}`);
      }
    }
    return suggestions;
  }
  /**
   * Calculate summary statistics
   */
  calculateSummary(issues, suggestions) {
    const totalIssues = issues.length;
    const fixableIssues = issues.filter((issue) => issue.fixable).length;
    const criticalIssues = issues.filter((issue) => issue.severity === "critical").length;
    const totalLinesChanged = suggestions.reduce((sum, suggestion) => sum + suggestion.estimatedSavings.lines, 0);
    const totalCharactersChanged = suggestions.reduce((sum, suggestion) => sum + suggestion.estimatedSavings.characters, 0);
    const estimatedMinutes = Math.ceil(totalIssues * 2 + suggestions.length * 5);
    const estimatedTime = `${estimatedMinutes} minute${estimatedMinutes !== 1 ? "s" : ""}`;
    return {
      totalIssues,
      fixableIssues,
      criticalIssues,
      estimatedSavings: {
        lines: totalLinesChanged,
        characters: totalCharactersChanged,
        percentage: totalIssues > 0 ? Math.round(fixableIssues / totalIssues * 100) : 0
      },
      estimatedTime
    };
  }
  /**
   * Create backup of directory
   */
  async createBackup(path2) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const backupPath = `${path2}.backup.${timestamp}`;
    try {
      await execAsync2(`cp -r "${path2}" "${backupPath}"`);
      console.log(`Backup created: ${backupPath}`);
    } catch (error) {
      console.warn(`Could not create backup: ${error.message}`);
    }
  }
  /**
   * Apply fixes to files
   */
  async applyFixes(suggestions, options) {
    for (const suggestion of suggestions) {
      try {
        await this.fixer.applySuggestion(suggestion, options);
        if (options.verbose) {
          console.log(`\u2713 Applied fix for: ${suggestion.issue.title}`);
          console.log(`  ${suggestion.explanation}`);
          console.log(`  Saved ~${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)`);
        }
      } catch (error) {
        console.error(`\u2717 Failed to apply fix for ${suggestion.issue.title}: ${error.message}`);
      }
    }
  }
  /**
   * Generate report
   */
  async generateReport(result, outputPath) {
    const report = this.formatter.formatReport(result);
    if (outputPath) {
      await writeFile2(outputPath, report);
      console.log(`Report saved to: ${outputPath}`);
    } else {
      console.log(report);
    }
  }
  /**
   * Format analysis result for console output
   */
  formatConsole(result) {
    let output = "\u{1F916} AI Refactor Analysis Report\n";
    output += "==================================================\n\n";
    output += "\u{1F4CA} Summary\n";
    output += "--------------------\n";
    output += `Files analyzed: ${result.totalFiles}
`;
    output += `Total issues: ${result.summary.totalIssues}
`;
    output += `Fixable issues: ${result.summary.fixableIssues}
`;
    output += `Critical issues: ${result.summary.criticalIssues}
`;
    output += `Estimated time: ${result.summary.estimatedTime}
`;
    output += `Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)

`;
    output += "\u{1F50D} Issues by Severity\n";
    const severityCount = { critical: 0, high: 0, medium: 0, low: 0 };
    result.issues.forEach((issue) => {
      severityCount[issue.severity]++;
    });
    const severityEmojis = { critical: "\u{1F534}", high: "\u{1F7E0}", medium: "\u{1F7E1}", low: "\u{1F7E2}" };
    Object.entries(severityCount).forEach(([severity, count]) => {
      if (count > 0) {
        output += `${severityEmojis[severity]} ${severity.toUpperCase()}: ${count} issues
`;
      }
    });
    return output;
  }
  /**
   * Format result for Markdown output
   */
  formatMarkdown(result) {
    let output = "# AI Refactor Analysis Report\n\n";
    output += `**Generated:** ${(/* @__PURE__ */ new Date()).toISOString()}
`;
    output += `**Files Analyzed:** ${result.totalFiles}

`;
    output += "## Summary\n\n";
    output += "| Metric | Value |\n";
    output += "|--------|-------|\n";
    output += `| Total Issues | ${result.summary.totalIssues} |
`;
    output += `| Fixable Issues | ${result.summary.fixableIssues} |
`;
    output += `| Critical Issues | ${result.summary.criticalIssues} |
`;
    output += `| Estimated Savings | ${result.summary.estimatedSavings.lines} lines |
`;
    output += `| Estimated Time | ${result.summary.estimatedTime} |
`;
    output += `| Savings Percentage | ${result.summary.estimatedSavings.percentage}% |

`;
    output += "## Issues Found\n\n";
    output += "| Severity | Category | File | Line | Description |\n";
    output += "|----------|----------|------|------|-------------|\n";
    result.issues.slice(0, 10).forEach((issue) => {
      const severityEmoji = { critical: "\u{1F534}", high: "\u{1F7E0}", medium: "\u{1F7E1}", low: "\u{1F7E2}" }[issue.severity];
      output += `| ${severityEmoji} | ${issue.category} | ${issue.file} | ${issue.line} | ${issue.title} |
`;
    });
    if (result.issues.length > 10) {
      output += `| ... | ... | ... | ... | ... (${result.issues.length - 10} more) |
`;
    }
    return output;
  }
  /**
   * Format suggestions for output
   */
  formatSuggestions(suggestions) {
    let output = "\u{1F527} Refactoring Suggestions\n";
    output += "==================================================\n\n";
    output += `Found ${suggestions.length} suggestions:

`;
    suggestions.forEach((suggestion, index) => {
      output += `${index + 1}. ${suggestion.issue.title}
`;
      output += `   File: ${suggestion.issue.file}:${suggestion.issue.line}
`;
      output += `   Severity: ${suggestion.issue.severity}
`;
      output += `   Confidence: ${Math.round(suggestion.confidence * 100)}%
`;
      output += `   Estimated savings: ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)
`;
      output += `   ${suggestion.explanation}

`;
    });
    return output;
  }
  /**
   * Format refactor result
   */
  formatRefactor(result) {
    let output = "\u{1F527} Refactoring Complete\n";
    output += "==================================================\n\n";
    output += "\u{1F4CA} Results\n";
    output += "--------------------\n";
    output += `Files processed: ${result.totalFiles}
`;
    output += `Total issues: ${result.summary.totalIssues}
`;
    output += `Fixed issues: ${result.summary.fixableIssues}
`;
    output += `Critical issues resolved: ${result.summary.criticalIssues}
`;
    output += `Lines saved: ${result.summary.estimatedSavings.lines} (${result.summary.estimatedSavings.percentage}%)
`;
    output += `Time saved: ${result.summary.estimatedTime}

`;
    if (result.warnings.length > 0) {
      output += "\u26A0\uFE0F Warnings\n";
      result.warnings.forEach((warning) => {
        output += `- ${warning}
`;
      });
      output += "\n";
    }
    if (result.errors.length > 0) {
      output += "\u274C Errors\n";
      result.errors.forEach((error) => {
        output += `- ${error}
`;
      });
    }
    return output;
  }
  /**
   * Format fix result
   */
  formatFix(result) {
    return this.formatRefactor(result);
  }
  /**
   * Format info result
   */
  formatInfo(result) {
    let output = "\u{1F4CA} Codebase Information\n";
    output += "==================================================\n\n";
    output += "\u{1F4C1} Overview\n";
    output += "--------------------\n";
    output += `Total files: ${result.totalFiles}
`;
    output += `Issues found: ${result.summary.totalIssues}
`;
    output += `Fixable issues: ${result.summary.fixableIssues}
`;
    output += `Critical issues: ${result.summary.criticalIssues}

`;
    output += "\u{1F4C8} By Category\n";
    output += "--------------------\n";
    const categories = {};
    result.issues.forEach((issue) => {
      categories[issue.category] = (categories[issue.category] || 0) + 1;
    });
    Object.entries(categories).forEach(([category, count]) => {
      output += `${category}: ${count}
`;
    });
    return output;
  }
  /**
   * Format verbose info
   */
  formatVerboseInfo(result) {
    let output = this.formatInfo(result);
    output += "\n\u{1F50D} Detailed Issues\n";
    output += "--------------------\n";
    result.issues.forEach((issue) => {
      output += `
\u{1F4C4} ${issue.file}:${issue.line}
`;
      output += `   ${issue.title}
`;
      output += `   Severity: ${issue.severity}
`;
      output += `   Category: ${issue.category}
`;
      output += `   ${issue.description}
`;
      if (issue.suggestion) {
        output += `   Suggestion: ${issue.suggestion}
`;
      }
      output += `   Code: ${issue.codeSnippet}
`;
    });
    return output;
  }
};

// src/index.ts
var aiRefactor = new AIRefactor();

// src/cli.ts
var program = new import_commander.Command();
program.name("ai-refactor-x").description("Zero-dependency AI-powered code refactoring tool").version("1.0.0");
program.option("-p, --pattern <pattern>", "File pattern to analyze (can be used multiple times)", (value, previous) => {
  return [...previous, value];
}, []).option("-i, --ignore <pattern>", "Pattern to ignore (can be used multiple times)", (value, previous) => {
  return [...previous, value];
}, []).option("-d, --depth <number>", "Maximum directory depth to analyze", parseInt).option("-m, --max-files <number>", "Maximum number of files to analyze", parseInt).option("--output-format <format>", "Output format (console|json|markdown)", "console").option("--ai-provider <provider>", "AI provider (openai|anthropic|local)", "openai").option("--model <model>", "AI model to use", "gpt-4").option("--output <file>", "Output file to save report").option("--config <file>", "Configuration file path").option("-v, --verbose", "Verbose output").option("--dry-run", "Show what would be fixed without making changes");
program.command("analyze").argument("<path>", "Path to analyze (file or directory)").description("Analyze code and identify issues").option("--fixable", "Only show fixable issues").option("--severity <level>", "Filter by severity (critical|high|medium|low)").option("--category <category>", "Filter by category").option("--format <format>", "Output format (console|json|markdown)", "console").option("--save-report <file>", "Save analysis report to file").action(async (path2, options) => {
  try {
    const config = await buildConfig(options);
    const aiRefactor2 = new AIRefactor(config);
    if (options.verbose) {
      console.log("\u{1F50D} Analyzing:", path2);
      console.log("Configuration:", JSON.stringify(config, null, 2));
    }
    const result = await aiRefactor2.analyze(path2, config);
    if (options.fixable) {
      result.issues = result.issues.filter((issue) => issue.fixable);
      result.suggestions = result.suggestions.filter((suggestion) => suggestion.issue.fixable);
    }
    if (options.severity) {
      result.issues = result.issues.filter((issue) => issue.severity === options.severity);
      result.suggestions = result.suggestions.filter((suggestion) => suggestion.issue.severity === options.severity);
    }
    if (options.category) {
      result.issues = result.issues.filter((issue) => issue.category === options.category);
      result.suggestions = result.suggestions.filter((suggestion) => suggestion.issue.category === options.category);
    }
    if (options.saveReport) {
      const report = formatReport(result, options.format);
      await writeFile3(options.saveReport, report);
      console.log(`\u{1F4C4} Report saved to: ${options.saveReport}`);
    } else {
      outputResult(result, options.format, options.verbose);
    }
    process.exit(result.issues.length === 0 ? 0 : 1);
  } catch (error) {
    console.error("\u274C Analysis failed:", error.message);
    process.exit(1);
  }
});
program.command("refactor").argument("<path>", "Path to refactor (file or directory)").description("Apply refactoring fixes to code").option("--fix", "Apply fixes automatically").option("--interactive", "Interactive mode for applying fixes").option("--backup", "Create backup before making changes (default: true)", true).option("--dry-run", "Show what would be fixed without making changes").option("--yes", "Auto-confirm all fixes").option("--suggestions-only", "Only show suggestions without applying").action(async (path2, options) => {
  try {
    const config = await buildConfig(options);
    const aiRefactor2 = new AIRefactor(config);
    if (options.verbose) {
      console.log("\u{1F527} Refactoring:", path2);
      console.log("Options:", JSON.stringify({
        fix: options.fix,
        interactive: options.interactive,
        backup: options.backup,
        dryRun: options.dryRun,
        yes: options.yes,
        suggestionsOnly: options.suggestionsOnly
      }, null, 2));
    }
    if (options.dryRun || options.suggestionsOnly) {
      const result = await aiRefactor2.analyze(path2, config);
      console.log("\u{1F4CB} Summary:");
      console.log(`- Files analyzed: ${result.totalFiles}`);
      console.log(`- Issues found: ${result.summary.totalIssues}`);
      console.log(`- Fixable issues: ${result.summary.fixableIssues}`);
      console.log(`- Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)`);
      if (options.suggestionsOnly) {
        console.log("\n\u{1F4A1} Suggestions:");
        for (const suggestion of result.suggestions.slice(0, 5)) {
          console.log(`- ${suggestion.issue.title} (${suggestion.issue.file}:${suggestion.issue.line})`);
          console.log(`  ${suggestion.explanation}`);
          console.log(`  Savings: ${suggestion.estimatedSavings.lines} lines`);
        }
        if (result.suggestions.length > 5) {
          console.log(`... and ${result.suggestions.length - 5} more suggestions`);
        }
      }
      return;
    }
    if (options.interactive) {
      const result = await aiRefactor2.analyze(path2, config);
      console.log("\u{1F4CB} Analysis complete:");
      console.log(`Found ${result.summary.totalIssues} issues (${result.summary.fixableIssues} fixable)`);
      for (const suggestion of result.suggestions) {
        console.log(`
\u{1F4A1} ${suggestion.issue.title}`);
        console.log(`   ${suggestion.explanation}`);
        console.log(`   Savings: ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)`);
        console.log(`   Confidence: ${Math.round(suggestion.confidence * 100)}%`);
        console.log(`   File: ${suggestion.issue.file}:${suggestion.issue.line}`);
        if (!options.yes) {
          const answer = await prompt("Apply this fix? (y/N): ");
          if (answer.toLowerCase() !== "y") {
            continue;
          }
        }
        try {
          await aiRefactor2.fix(path2, [suggestion.issue]);
          console.log(`\u2705 Applied fix: ${suggestion.issue.title}`);
        } catch (error) {
          console.error(`\u274C Failed to apply fix: ${error.message}`);
        }
      }
      return;
    }
    if (options.fix) {
      const result = await aiRefactor2.refactor(path2, {
        fix: true,
        interactive: false,
        backup: options.backup,
        dryRun: false,
        verbose: options.verbose,
        output: "",
        yes: options.yes
      });
      console.log("\u2705 Refactoring complete!");
      console.log(`- Fixed ${result.summary.fixableIssues} issues`);
      console.log(`- Saved ${result.summary.estimatedSavings.lines} lines`);
      console.log(`- Time saved: ${result.summary.estimatedTime}`);
      if (result.warnings.length > 0) {
        console.log("\n\u26A0\uFE0F Warnings:");
        for (const warning of result.warnings) {
          console.log(`- ${warning}`);
        }
      }
      if (result.errors.length > 0) {
        console.log("\n\u274C Errors:");
        for (const error of result.errors) {
          console.log(`- ${error}`);
        }
      }
    }
  } catch (error) {
    console.error("\u274C Refactoring failed:", error.message);
    process.exit(1);
  }
});
program.command("fix").argument("<path>", "Path to fix (file or directory)").description("Quick fix command for issues").option("--backup", "Create backup before making changes", true).option("--interactive", "Interactive mode").action(async (path2, options) => {
  try {
    const config = await buildConfig(options);
    const aiRefactor2 = new AIRefactor(config);
    if (options.verbose) {
      console.log("\u{1F527} Quick fix:", path2);
    }
    const result = await aiRefactor2.fix(path2);
    console.log("\u2705 Fix complete!");
    console.log(`- Fixed ${result.summary.fixableIssues} issues`);
    console.log(`- Saved ${result.summary.estimatedSavings.lines} lines`);
    console.log(`- Time saved: ${result.summary.estimatedTime}`);
  } catch (error) {
    console.error("\u274C Fix failed:", error.message);
    process.exit(1);
  }
});
program.command("suggest").argument("<path>", "Path to get suggestions for").description("Get refactoring suggestions without applying them").option("--save <file>", "Save suggestions to file").action(async (path2, options) => {
  try {
    const config = await buildConfig(options);
    const aiRefactor2 = new AIRefactor(config);
    if (options.verbose) {
      console.log("\u{1F4A1} Getting suggestions for:", path2);
    }
    const suggestions = await aiRefactor2.suggest(path2);
    console.log("\u{1F4CB} Refactoring Suggestions:");
    console.log(`Found ${suggestions.length} suggestions
`);
    for (const suggestion of suggestions) {
      console.log(`\u{1F4A1} ${suggestion.issue.title}`);
      console.log(`   File: ${suggestion.issue.file}:${suggestion.issue.line}`);
      console.log(`   Category: ${suggestion.issue.category}`);
      console.log(`   Severity: ${suggestion.issue.severity}`);
      console.log(`   Confidence: ${Math.round(suggestion.confidence * 100)}%`);
      console.log(`   Savings: ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)`);
      console.log(`   Explanation: ${suggestion.explanation}
`);
    }
    if (options.save) {
      const report = {
        suggestions: suggestions.map((s) => ({
          id: s.id,
          title: s.issue.title,
          file: s.issue.file,
          line: s.issue.line,
          category: s.issue.category,
          severity: s.issue.severity,
          confidence: s.confidence,
          savings: s.estimatedSavings,
          explanation: s.explanation,
          beforeCode: s.beforeCode,
          afterCode: s.afterCode
        })),
        total: suggestions.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      await writeFile3(options.save, JSON.stringify(report, null, 2));
      console.log(`\u{1F4C4} Suggestions saved to: ${options.save}`);
    }
  } catch (error) {
    console.error("\u274C Failed to get suggestions:", error.message);
    process.exit(1);
  }
});
program.command("info").argument("<path>", "Path to get information about").description("Get information about a codebase").action(async (path2) => {
  try {
    const config = await buildConfig({});
    const aiRefactor2 = new AIRefactor(config);
    const result = await aiRefactor2.analyze(path2, config);
    console.log("\u{1F4CA} Codebase Information:");
    console.log(`Files analyzed: ${result.totalFiles}`);
    console.log(`Total issues: ${result.summary.totalIssues}`);
    console.log(`Fixable issues: ${result.summary.fixableIssues}`);
    console.log(`Critical issues: ${result.summary.criticalIssues}`);
    console.log(`Estimated time to fix: ${result.summary.estimatedTime}`);
    console.log(`Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)`);
    const categories = result.issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {});
    console.log("\n\u{1F4C8} Issues by Category:");
    Object.entries(categories).sort(([, a], [, b]) => b - a).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
  } catch (error) {
    console.error("\u274C Failed to get info:", error.message);
    process.exit(1);
  }
});
async function buildConfig(options) {
  const config = {
    patterns: options.pattern || ["**/*.{js,ts,jsx,tsx}"],
    ignore: options.ignore || ["**/node_modules/**", "**/dist/**", "**/build/**", "**/*.test.*", "**/*.spec.*"],
    depth: options.depth,
    maxFiles: options.maxFiles,
    outputFormat: options.outputFormat || "console",
    aiProvider: options.aiProvider || "openai",
    model: options.model || "gpt-4"
  };
  if (options.config) {
    try {
      const configData = await readFile5(join2(process.cwd(), options.config), "utf-8");
      const fileConfig = JSON.parse(configData);
      Object.assign(config, fileConfig);
    } catch (error) {
      if (options.verbose) {
        console.warn(`Could not load config file: ${error.message}`);
      }
    }
  }
  return config;
}
function formatReport(result, format) {
  switch (format) {
    case "json":
      return JSON.stringify(result, null, 2);
    case "markdown":
      return formatMarkdownReport(result);
    default:
      return formatConsoleReport(result);
  }
}
function formatConsoleReport(result) {
  let output = "";
  output += `\u{1F4CA} Analysis Report
`;
  output += `Files: ${result.totalFiles}
`;
  output += `Issues: ${result.summary.totalIssues}
`;
  output += `Fixable: ${result.summary.fixableIssues}
`;
  output += `Savings: ${result.summary.estimatedSavings.lines} lines
`;
  return output;
}
function formatMarkdownReport(result) {
  let markdown = `# AI Refactor Report

`;
  markdown += `Files: ${result.totalFiles}
`;
  markdown += `Issues: ${result.summary.totalIssues}
`;
  markdown += `Fixable: ${result.summary.fixableIssues}
`;
  return markdown;
}
function outputResult(result, format, verbose) {
  if (format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (format === "markdown") {
    console.log(formatMarkdownReport(result));
    return;
  }
  console.log(`\u{1F4CA} Analysis Complete!`);
  console.log(`\u{1F4C1} Files analyzed: ${result.totalFiles}`);
  console.log(`\u{1F50D} Issues found: ${result.summary.totalIssues}`);
  console.log(`\u{1F527} Fixable issues: ${result.summary.fixableIssues}`);
  console.log(`\u{1F680} Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)`);
  console.log(`\u23F1\uFE0F  Estimated time: ${result.summary.estimatedTime}`);
  if (result.warnings.length > 0 && verbose) {
    console.log("\n\u26A0\uFE0F Warnings:");
    result.warnings.forEach((warning) => console.log(`  ${warning}`));
  }
  if (result.errors.length > 0 && verbose) {
    console.log("\n\u274C Errors:");
    result.errors.forEach((error) => console.log(`  ${error}`));
  }
}
async function prompt(question) {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
program.parse();
//# sourceMappingURL=cli.js.map