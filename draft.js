mounted: function() {
    var t = this;
    t.channelData = null,
        this.canvasCtx = document.getElementById("waveCanvas").getContext("2d"),
        this.eventHandlers.onResize = t.resize,
        s["a"].$on("vmus-resize", this.eventHandlers.onResize),
        this.eventHandlers.onContext = function (e) {
            return t.onContext(e)
        }
        ,
        s["a"].$on("vmus-context", this.eventHandlers.onContext),
        this.eventHandlers.onRender = function (e) {
            return t.renderAudio(e)
        }
        ,
        s["a"].$on("vmus-render", this.eventHandlers.onRender),
        this.eventHandlers.onDraw = function (e) {
            var i = e.from
                , n = e.to
                , a = e.cur;
            t.drawView(i, n, a)
        }
        ,
        s["a"].$on("vmus-draw", this.eventHandlers.onDraw),
        s["a"].$on("vmus-download-wave", this.download)
},

beforeDestroy: function() {
    s["a"].$off("vmus-render", this.eventHandlers.onRender),
        s["a"].$off("vmus-context", this.eventHandlers.onContext),
        s["a"].$off("vmus-draw", this.eventHandlers.onDraw),
        s["a"].$off("vmus-resize", this.eventHandlers.onResize),
        this.eventHandlers = null,
        window.onresizeWave = null,
        this.channelData = null,
        this.canvasCtx = null
},
methods: {
    onContext: function(t) {
        if ("zoomwheel" in t && t.zoomwheel) {
            var e = Math.min(this.fromTime, this.toTime) * this.sampleRate
                , i = Math.max(this.fromTime, this.toTime) * this.sampleRate
                , n = Math.max((i - e) / this.canvasWidth, 1);
            this.frameSize != n && n > 10 && this.processFrames(n, this.drawView)
        }
        "style" in t && (this.style = t.style),
            "showBeats" in t && (this.showBeats = t.showBeats),
            "editmode" in t && (this.editmode = t.editmode,
                ["delete", "snap"].includes(this.editmode) ? (clearInterval(this.interval),
                    this.interval = setInterval(this.blinkAnimation, 500)) : clearInterval(this.interval)),
            this.drawView()
    },
    resize: function() {
        var t, e, i = document.getElementById("waveCanvas"), n = document.getElementById("waveform");
        this.needleX /= this.scaleW,
            t = n.clientWidth,
            e = n.clientHeight,
            this.scaleW = t / i.width,
            this.scaleH = e / i.height,
            i.width = t,
            i.height = e,
            this.canvasWidth = i.width,
            this.canvasHeight = i.height,
            this.needleX *= this.scaleW,
            this.colorStyle(),
            "off" !== this.showBeats && this.$refs.beats.drawView(this.fromTime, this.toTime, this.currentTime),
            this.drawView()
    },
    renderAudio: function() {
        var t = Object(r["a"])(regeneratorRuntime.mark((function t(e) {
            var i, n, a;
            return regeneratorRuntime.wrap((function (t) {
                while (1)
                    switch (t.prev = t.next) {
                        case 0:
                            this.channelData = new Float32Array(e.getChannelData(0)),
                                this.canvasWidth = 0 | document.getElementById("waveform").clientWidth,
                                this.canvasHeight = 0 | document.getElementById("waveform").clientHeight,
                                this.numberOfChannels = e.numberOfChannels,
                                this.sampleRate = e.sampleRate,
                                this.audioDuration = e.duration,
                                i = document.getElementById("waveCanvas"),
                                i.width = this.canvasWidth,
                                i.height = this.canvasHeight,
                                this.canvasCtx = i.getContext("2d"),
                                this.colorStyle(),
                                this.fromTime = 0 == this.fromTime ? -this.audioDuration / 10 : this.fromTime,
                                this.toTime = 0 == this.toTime ? this.audioDuration / 10 : this.toTime,
                                this.currentTime = 0 == this.currentTime ? 0 : this.currentTime,
                                n = Math.min(this.fromTime, this.toTime) * this.sampleRate,
                                a = Math.max(this.fromTime, this.toTime) * this.sampleRate,
                                this.frameSize = Math.max((a - n) / this.canvasWidth, 1),
                                this.processFrames(this.frameSize, this.resize);
                        case 18:
                        case "end":
                            return t.stop()
                    }
            }
            ), t, this)
        }
        )));
        function e(e) {
            return t.apply(this, arguments)
        }
        return e
    } (),
        processFrames: function(t, e) {
            var i = new l
                , n = this;
            i.postMessage({
                method: "wavezoom",
                channelData: n.channelData,
                frameSize: t
            }),
                i.onmessage = function (a) {
                    var r = a.data;
                    "cmd" in r && "allframes" === r.cmd && (n.frameCrest = r.frameCrest,
                        n.frameTrough = r.frameTrough,
                        n.frameRms = r.frameRms,
                        n.frameSize = t,
                        i.terminate(),
                        e())
                }
        },
    calcSkip: function(t, e) {
        for (var i = t, n = [], a = [], r = [], s = this.channelData.length, o = 0; o < s / i; o++) {
            var h = o * i | 0
                , u = h + i
                , l = this.channelData.subarray(h, u)
                , c = l.reduce((function (t, e) {
                    return Math.max(t, e)
                }
                ))
                , d = l.reduce((function (t, e) {
                    return Math.min(t, e)
                }
                ))
                , m = i <= 50 ? 0 : Math.sqrt(l.reduce((function (t, e) {
                    return t + e * e
                }
                ), 0) / i);
            n.push(c),
                a.push(d),
                r.push(m)
        }
        this.frameCrest = n,
            this.frameTrough = a,
            this.frameRms = r,
            this.frameSize = t,
            e()
    },
    colorStyle: function() {
        "heaven" === this.style && (this.gradientWave = this.canvasCtx.createLinearGradient(0, 0, 0, this.canvasHeight),
            this.gradientWave.addColorStop(.05, "#FD7395"),
            this.gradientWave.addColorStop(.35, "#6D83FD"),
            this.gradientWave.addColorStop(.65, "#99FF54"),
            this.gradientWave.addColorStop(.95, "#FD6560")),
            "lighten" === this.style && (this.gradientWave = this.canvasCtx.createLinearGradient(0, 0, 0, this.canvasHeight),
                this.gradientWave.addColorStop(0, "#7BFFCD"),
                this.gradientWave.addColorStop(.48, "#BF69FF"),
                this.gradientWave.addColorStop(.5, "#FFF9FF"),
                this.gradientWave.addColorStop(.52, "#BF69FF"),
                this.gradientWave.addColorStop(1, "#7BFFCD")),
            "oven" === this.style && (this.gradientWave = this.canvasCtx.createLinearGradient(0, 0, 0, this.canvasHeight),
                this.gradientWave.addColorStop(0, "#FC4E17"),
                this.gradientWave.addColorStop(.5, "#FFFEF5"),
                this.gradientWave.addColorStop(1, "#FC4E17")),
            "golden" === this.style && (this.gradientWave = this.canvasCtx.createLinearGradient(0, 0, 0, this.canvasHeight),
                this.gradientWave.addColorStop(.1, "#E0C857"),
                this.gradientWave.addColorStop(.5, "#FFFFD8"),
                this.gradientWave.addColorStop(.9, "#E0C857")),
            "frozen" === this.style && (this.gradientWave = this.canvasCtx.createLinearGradient(0, 0, 0, this.canvasHeight),
                this.gradientWave.addColorStop(0, "#7FE9FF"),
                this.gradientWave.addColorStop(.5, "#FFFEF5"),
                this.gradientWave.addColorStop(1, "#7FE9FF")),
            "none" === this.style && (this.gradientWave = this.canvasCtx.createLinearGradient(0, 0, 0, this.canvasHeight),
                this.gradientWave.addColorStop(0, "#E6E6E6"),
                this.gradientWave.addColorStop(1, "#E6E6E6")),
            this.gradientBack = this.canvasCtx.createLinearGradient(0, 0, 0, this.canvasHeight),
            this.gradientBack.addColorStop(0, "#3B70A8"),
            this.gradientBack.addColorStop(.1, "#000000"),
            this.gradientBack.addColorStop(.9, "#000000"),
            this.gradientBack.addColorStop(1, "#3B70A8")
    },
    drawView: function(t, e, i) {
        var n = arguments.length > 3 && void 0 !== arguments[3] && arguments[3]
            , a = null != t ? t : this.fromTime
            , r = null != e ? e : this.toTime
            , s = null != i ? i : this.currentTime;
        this.fromTime = a,
            this.toTime = r,
            this.currentTime = s,
            this.viewLength = Math.abs(r - a);
        var o = .5 * this.canvasHeight | 0
            , h = this.canvasCtx
            , u = this.canvasCtx;
        if (h) {
            var l = this
                , c = function (t, e, i, n) {
                    if (!l.channelData)
                        return null;
                    var a = 1 / n;
                    h.beginPath(),
                        h.strokeStyle = "white",
                        h.lineWidth = .95;
                    var r = o;
                    if (n > 10) {
                        for (var s = l.frameCrest, u = l.frameTrough, c = (l.frameRms,
                            n / l.frameSize), d = e; d < i; d++) {
                            var m = 0 | (d + t) * c
                                , f = s[m]
                                , p = u[m];
                            h.moveTo(d, (f + 1) * r | 0),
                                h.lineTo(d, (p + 1) * r | 0)
                        }
                        h.stroke()
                    } else {
                        h.moveTo(e, l.canvasHeight / 2);
                        for (var v = l.channelData, g = v.length, b = e; b < i; b += a) {
                            var w = (b + t) * n | 0
                                , y = 0;
                            w >= 0 && w < g && (y = v[w]),
                                h.lineTo(b, (y + 1) * r | 0)
                        }
                        h.stroke()
                    }
                }
                , d = function (t, e, i, n) {
                    if (!l.channelData)
                        return null;
                    var a = o
                        , r = l.frameCrest
                        , s = l.frameTrough
                        , h = l.frameRms
                        , c = n / l.frameSize;
                    if (n > 50) {
                        u.beginPath(),
                            u.lineWidth = .3;
                        for (var d = e; d < i; d++) {
                            var m = 0 | (d + t) * c
                                , f = h[m]
                                , p = r[m]
                                , v = s[m];
                            v < f && f < p && (u.moveTo(d, (1 - f) * a | 0),
                                u.lineTo(d, (f + 1) * a | 0))
                        }
                        u.stroke()
                    }
                }
                , m = Math.min(a, r) * this.sampleRate
                , f = Math.max(a, r) * this.sampleRate
                , p = Math.max((f - m) / this.canvasWidth, 1)
                , v = 0 | m / p;
            h.save(),
                h.clearRect(0, 0, this.canvasWidth, this.canvasHeight),
                c(v, 0, this.canvasWidth, p),
                h.globalCompositeOperation = "source-in",
                h.fillStyle = this.gradientWave,
                h.fillRect(0, 0, this.canvasWidth, this.canvasHeight),
                h.globalCompositeOperation = "lighter",
                d(v, 0, this.canvasWidth, p),
                0 == n && (h.globalCompositeOperation = "destination-atop",
                    h.fillStyle = this.gradientBack,
                    h.fillRect(0, 0, this.canvasWidth, this.canvasHeight)),
                h.globalCompositeOperation = "source-over",
                "off" !== this.showBeats && this.$refs.beats.drawView(a, r, s);
            var g = s * this.sampleRate
                , b = (g - m) / (f - m) * this.canvasWidth;
            0 == n && this.drawCrosshair(b)
        }
    },
    drawCrosshair: function(t) {
        var e = this.canvasCtx
            , i = this.canvasHeight;
        "add" == this.editmode ? (e.save(),
            e.globalCompositeOperation = "difference",
            e.strokeStyle = "white",
            e.lineWidth = 2,
            e.beginPath(),
            e.moveTo(t, 0),
            e.lineTo(t, i),
            e.closePath(),
            e.stroke(),
            e.restore()) : "delete" == this.editmode ? (e.save(),
                this.blink ? (e.globalCompositeOperation = "screen",
                    e.strokeStyle = "red",
                    e.lineWidth = 6,
                    e.setLineDash([4, 4])) : (e.globalCompositeOperation = "source-over",
                        e.strokeStyle = "red",
                        e.lineWidth = 3,
                        e.setLineDash([8, 2])),
                e.beginPath(),
                e.moveTo(t, 0),
                e.lineTo(t, i),
                e.stroke(),
                e.restore()) : "snap" == this.editmode && (e.save(),
                    this.blink ? (e.globalCompositeOperation = "screen",
                        e.strokeStyle = "#0000ffa0",
                        e.lineWidth = 12,
                        e.beginPath(),
                        e.moveTo(t - 7, 0),
                        e.lineTo(t - 7, i),
                        e.moveTo(t + 7, 0),
                        e.lineTo(t + 7, i),
                        e.stroke(),
                        e.restore()) : (e.globalCompositeOperation = "source-over",
                            e.strokeStyle = "#0000ffa0",
                            e.lineWidth = 25,
                            e.beginPath(),
                            e.moveTo(t, 0),
                            e.lineTo(t, i),
                            e.stroke(),
                            e.restore()))
    },
    blinkAnimation: function() {
        this.empty && clearInterval(this.interval),
            this.blink = !this.blink,
            this.drawView()
    },
    onWheel: function(t) {
        var e = t.deltaX
            , i = e / this.canvasWidth * this.viewLength;
        s["a"].$emit("onDrag", {
            deltaTime: i,
            dragging: !0
        }),
            this.fromTime += i,
            this.toTime += i
    },
    onMouseMove: function(t) {
        var e = "touchmove" === t.type ? t.touches[0].clientX : t.clientX;
        "touchmove" === t.type ? t.touches[0].clientY : t.clientY;
        if (this.mouseDown) {
            var i = this.mouseX - e
                , n = i / this.canvasWidth * this.viewLength;
            s["a"].$emit("onDrag", {
                deltaTime: n,
                dragging: !0
            }),
                this.mouseX = e
        }
    },
    onMouseDown: function(t) {
        "ontouchstart" in window && "mousedown" === t.type || (this.mouseDown = !0,
            this.mouseX = "touchstart" === t.type ? t.touches[0].clientX : t.clientX,
            s["a"].$emit("onDrag", {
                deltaTime: 0,
                dragging: !0
            }),
            document.addEventListener("touchstart" === t.type ? "touchmove" : "mousemove", this.onMouseMove),
            document.addEventListener("touchstart" === t.type ? "touchend" : "mouseup", this.onMouseUp, {
                once: !0
            }))
    },
    onMouseUp: function(t) {
        this.mouseDown && s["a"].$emit("onDrag", {
            deltaTime: 0,
            dragging: !1
        }),
            this.mouseDown = !1,
            document.removeEventListener("touchend" === t.type ? "touchmove" : "mousemove", this.onMouseMove)
    },
    download: function(t) {
        var e = document.createElement("a");
        e.download = t + ".png";
        var i = document.getElementById("waveCanvas")
            , n = document.createElement("canvas");
        n.width = this.canvasWidth,
            n.height = this.canvasHeight;
        var a = n.getContext("2d");
        this.drawView(null, null, null, !0),
            a.drawImage(i, 0, 0),
            e.href = n.toDataURL(),
            e.click(),
            this.drawView()
    }
}