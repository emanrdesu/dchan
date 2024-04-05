// String
declare global {
   interface String {
      titleCase: () => string
      toRegex: () => RegExp
   }
}

String.prototype.titleCase = function () {
   return this.charAt(0).toUpperCase() + this.slice(1)
}

String.prototype.toRegex = function (o = 'g') {
   return new RegExp(this + '', o)
}

// Array

declare global {
   interface Array<T> {
      promise: (x: T) => Promise<any[]>
      randelt: () => T
   }
}

Array.prototype.promise = function (f) {
   return Promise.all(this.map(f))
}

Array.prototype.randelt = function () {
   return this[Math.floor(Math.random() * this.length)]
}

export default {}
