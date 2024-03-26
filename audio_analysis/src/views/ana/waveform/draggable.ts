export function makeDraggable( // 使元素可拖动
    element: HTMLElement | null, // 元素
    onDrag: (dx: number, dy: number, x: number, y: number) => void, // 拖动事件
    onStart?: (x: number, y: number) => void, // 开始拖动事件
    onEnd?: () => void, // 结束拖动事件
    threshold = 3, // 阈值
    mouseButton = 0, // 鼠标按键
): () => void { // 返回取消函数
    if (!element) return () => void 0 // 如果元素不存在，返回空函数

    let unsubscribeDocument = () => void 0 // 取消函数

    const onPointerDown = (event: PointerEvent) => { // 按下事件
        if (event.button !== mouseButton) return // 如果按键不是指定按键，返回

        event.preventDefault() // 阻止默认事件
        event.stopPropagation() // 阻止冒泡

        let startX = event.clientX // 开始坐标 X
        let startY = event.clientY // 开始坐标 Y
        let isDragging = false // 是否拖动

        const onPointerMove = (event: PointerEvent) => { // 移动事件
            event.preventDefault() // 阻止默认事件
            event.stopPropagation() // 阻止冒泡

            const x = event.clientX // 当前坐标 X
            const y = event.clientY // 当前坐标 Y
            const dx = x - startX // X 距离
            const dy = y - startY // Y 距离

            if (isDragging || Math.abs(dx) > threshold || Math.abs(dy) > threshold) { // 如果拖动或距离大于阈值
                const rect = element.getBoundingClientRect() // 元素位置
                const { left, top } = rect // 左上角坐标

                if (!isDragging) { // 如果没有拖动
                    onStart?.(startX - left, startY - top) // 开始拖动事件
                    isDragging = true // 设置拖动
                }

                onDrag(dx, dy, x - left, y - top) // 拖动事件

                startX = x // 更新开始坐标 X
                startY = y // 更新开始坐标 Y
            }
        }

        const onPointerUp = () => { // 松开事件
            if (isDragging) { // 如果拖动
                onEnd?.() // 结束拖动事件
            }
            unsubscribeDocument() // 取消函数
        }

        const onPointerLeave = (e: PointerEvent) => { // 移出事件
            // 仅监听 document 上的事件，而不监听内部元素上的事件
            if (!e.relatedTarget || e.relatedTarget === document.documentElement) { // 如果没有相关目标或相关目标是 document
                onPointerUp() // 松开事件
            }
        }

        const onClick = (event: MouseEvent) => { // 点击事件
            if (isDragging) { // 如果拖动
                event.stopPropagation() // 阻止冒泡
                event.preventDefault() // 阻止默认事件
            }
        }

        const onTouchMove = (event: TouchEvent) => { // 触摸移动事件
            if (isDragging) { // 如果拖动
                event.preventDefault() // 阻止默认事件
            }
        }

        document.addEventListener('pointermove', onPointerMove) // 监听移动事件
        document.addEventListener('pointerup', onPointerUp) // 监听松开事件
        document.addEventListener('pointerout', onPointerLeave) // 监听移出事件
        document.addEventListener('pointercancel', onPointerLeave) // 监听取消事件
        document.addEventListener('touchmove', onTouchMove, { passive: false }) // 监听触摸移动事件，主动
        document.addEventListener('click', onClick, { capture: true }) // 监听点击事件，捕获

        unsubscribeDocument = () => { // 取消函数
            document.removeEventListener('pointermove', onPointerMove) // 移除移动事件
            document.removeEventListener('pointerup', onPointerUp) // 移除松开事件
            document.removeEventListener('pointerout', onPointerLeave) // 移除移出事件
            document.removeEventListener('pointercancel', onPointerLeave) // 移除取消事件
            document.removeEventListener('touchmove', onTouchMove) // 移除触摸移动事件
            setTimeout(() => { // 延迟移除点击事件
                document.removeEventListener('click', onClick, { capture: true }) // 移除点击事件，捕获
            }, 10) // 延迟 10 毫秒
        }
    }

    element.addEventListener('pointerdown', onPointerDown) // 监听按下事件

    return () => { // 返回取消函数
        unsubscribeDocument() // 取消函数
        element.removeEventListener('pointerdown', onPointerDown) // 移除按下事件
    }
}