export type StateChangeType = 'add' | 'update' | 'delete';
export type StateChangeCallback<K extends keyof any, V> = (changeType: StateChangeType, key: K, value?: V) => void;
export type SetStateValue<T extends object> = Partial<T> | ((current: T, state: State<T>) => Partial<T>);

export class State<T extends object = any> {
    private state: Partial<T>;
    private observers: StateChangeCallback<keyof T, T[keyof T]>[];
    private _version = 0

    constructor(options?: { initialState: Partial<T>}) {
        this.state = {
            ...(options?.initialState || {}) as Partial<T>
        };
        this.observers = [];
        
        Object.defineProperty(this, 'state', { enumerable: false });
        Object.defineProperty(this, '_version', { enumerable: false });
        Object.defineProperty(this, 'observers', { enumerable: false });
    }
    
    get version() {
        return this._version
    }

    observe(callback: StateChangeCallback<keyof T, T[keyof T]>): () => void {
        this.observers.push(callback);

        return () => {
            const index = this.observers.indexOf(callback);
            if (index !== -1) {
                this.observers.splice(index, 1);
            }
        };
    }

    keys() : string[] {
        return Object.keys(this.state);
    }

    get<K extends keyof T>(key: K): T[K] | undefined {
        return this.state[key];
    }

    set<K extends keyof T>(key: K, value: T[K]): this {
        if(value === this.state[key]) {
          return this
        }

        const changeType: StateChangeType = this.state.hasOwnProperty(key) ? 'update' : 'add';
        this.state[key] = value;
        this._version++
        this.observers.forEach(callback => callback(changeType, key, value));
        return this
    }

    delete<K extends keyof T>(key: K): this {
        if (this.state.hasOwnProperty(key)) {
            const value = this.state[key];
            delete this.state[key];
            this._version++
            this.observers.forEach(callback => callback('delete', key, value));
        }
        
        return this
    }

    has<K extends keyof T>(key: K): boolean {
        return this.state.hasOwnProperty(key);
    }

    get current(): T {
        return this.state as T;
    }

    clear(): void {
        const keys = Object.keys(this.state);
        this.state = {};
        this._version++
        keys.forEach(key => {
            this.observers.forEach(callback => callback('delete', key as keyof T));
        });
    }
   
    entries() : [keyof T, T[keyof T]][] {
        return Object.entries(this.state) as [keyof T, T[keyof T]][];
    }

    values() : T[keyof T][] {
      return Object.values(this.state);
    }

    setState(value: SetStateValue<T>): void {
        const newState = typeof value === 'function' ? value(this.current, this) : value;
        for (const key in newState) {
            if (Object.prototype.hasOwnProperty.call(newState, key)) {
                // @ts-ignore-next-line
                this.set(key as keyof T, newState[key as keyof T]);
            }
        }
    }
}