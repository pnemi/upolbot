String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

Array.prototype.isUnique = function() {
  return (new Set(this)).size === this.length;
};
