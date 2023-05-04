type Listener = (...args: any[]) => void;

export class Bus {
    private events: Map<string, Listener[]>;

    constructor() {
        this.events = new Map();
    }

    async waitFor(event: string): Promise<any> {
        return new Promise(resolve => {
            this.once(event, resolve);
        });
    }

    emit(event: string, ...args: any[]): void {
        const listeners = this.events.get(event);
        if (!listeners) return;
        
        listeners.forEach(listener => listener(...args));
    }

    on(event: string, listener: Listener): void {
        const listeners = this.events.get(event) || [];
        listeners.push(listener);
        this.events.set(event, listeners);
    }

    once(event: string, listener: Listener): void {
        const onceListener: Listener = (...args: any[]) => {
            listener(...args);
            this.off(event, onceListener);
        };
        this.on(event, onceListener);
    }

    off(event: string, listener?: Listener): void {
        const listeners = this.events.get(event);
        if (!listeners) return;
        
        if (!listener) {
            this.events.delete(event);
            return;
        }

        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }
}
