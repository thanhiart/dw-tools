export class NoThrow {
  message: string;
  result: any;

  constructor() {}

  async single(func: Function, ...agrs: any) {
    this.reset();
    try {      
      this.result = await func(...agrs);
      return undefined;
    } catch (error) {
      this.message = error.message;
      return this.message;
    }
  }

  async many(funcs: Function[]) {
    this.reset();
    try {      
      this.result = [];
      for(const func of funcs) {
        this.result.push(await func());
      }
      return undefined;
    } catch (error) {
      this.message = error.message;
      return this.message;
    }    
  }

  async reset() {
    this.message = '';
    this.result = undefined;
  }
}

export default {
  NoThrow,
};
