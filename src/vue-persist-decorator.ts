import { createDecorator } from 'vue-class-component'

export interface PersistOptions {
    expiry?: string
    key?: string
    immediate?: boolean
    deep?: boolean
}

export interface PersistObject {
    value: string
    expiry?: number
}

export function Persist(options: PersistOptions = {}): PropertyDecorator {
    return createDecorator((opts, k) => {
        const name = (opts.name || '_').toLowerCase()
        const { key = `${name}_${k}`, expiry: expiryString, immediate = false, deep = true } = options

        opts.mixins = [
            ...(opts.mixins || []),
            {
                mounted() {
                    // Get stored values
                    const item = localStorage.getItem(key)
                    if (item) {
                        try {
                            const data: PersistObject = JSON.parse(item)
                            if (!data.expiry || new Date(data.expiry).getTime() - Date.now() > 0) this[k] = data.value
                        } catch (e) {
                            console.log(e)
                        }
                    }

                    // Setup watch handler
                    this.$watch(
                        k,
                        (value: any) => {
                            const persist: PersistObject = { value }
                            if (expiryString) persist.expiry = parseRelativeTime(expiryString)
                            localStorage.setItem(key, JSON.stringify(persist))
                        },
                        { immediate, deep },
                    )
                },
            },
        ]
    })
}

export function parseRelativeTime(dateString: string): number {
    const epoch = Date.now()
    const dateArray: string[] = dateString.split(/([a-zA-Z]+)/)
    if (isNaN(+dateArray[0])) throw new Error('Failed to parse time.')

    const input = Math.round(+dateArray[0])
    const extensions: { [key: string]: number } = {
        ms: 1,
        s: 1000,
        m: 1000 * 60,
        h: 1000 * 60 * 60,
        d: 1000 * 60 * 60 * 24,
    }
    const multiplier: number = extensions[dateArray[1]] || extensions.h
    return epoch + input * multiplier
}
