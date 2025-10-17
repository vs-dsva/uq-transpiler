// Generated from payroll-demo.uni
// Concept to JavaScript transpiler

"use strict";

import { ConceptRuntime } from "./concept-runtime.js";

class ConceptApplication {
constructor() {
this.runtime = new ConceptRuntime();
this.runtime.setApplication(this);
this.fields = {};
this.constants = {};
this.eventHandlers = {};

// Initialize constants
this.constants.COMPANY = "Visma Enterprise";
this.constants.TAX_RATE = 0.25;

}

initializeFields() {
    this.fields["empId"] = 0; // number (int32)
    this.fields["empName"] = ""; // any
    this.fields["grossSalary"] = 0; // number (int32)
    this.fields["netSalary"] = 0; // number (int32)
    this.fields["taxAmount"] = 0; // number (int32)
}

  // Online Application: PayrollSystem
  setApplicationName(name) {
    this.applicationName = "PayrollSystem";
  }

  async handle__START(event) {
    // Event handler: @START
    this.fields["empId"] = 12345;
    this.fields["empName"] = "Alice Johnson";
    this.fields["grossSalary"] = 80000;
    await this.runtime.call("CalculateTax", );
    await this.runtime.call("CalculateNetSalary", );
  }

  // Register event handler for @START
  async CalculateTax(params = {}) {
    // XTRA function: CalculateTax
    await this.runtime.triggerEvent("@xtra_CalculateTax");
  }

  async handle__xtra_CalculateTax(event) {
    // Event handler: @xtra (CalculateTax)
    this.fields["taxAmount"] = (this.fields["grossSalary"] * 0.25);
  }

  // Register event handler for @xtra
  async CalculateNetSalary(params = {}) {
    // XTRA function: CalculateNetSalary
    await this.runtime.triggerEvent("@xtra_CalculateNetSalary");
  }

  async handle__xtra_CalculateNetSalary(event) {
    // Event handler: @xtra (CalculateNetSalary)
    this.fields["netSalary"] = (this.fields["grossSalary"] - this.fields["taxAmount"]);
  }

  // Register event handler for @xtra
async run() {
this.initializeFields();
// Register event handlers
this.runtime.registerEventHandler("@START", this.handle__START.bind(this));
this.runtime.registerEventHandler("@xtra_CalculateTax", this.handle__xtra_CalculateTax.bind(this));
this.runtime.registerEventHandler("@xtra_CalculateNetSalary", this.handle__xtra_CalculateNetSalary.bind(this));
await this.runtime.triggerEvent("@START");
return this;
}

static async create() {
const app = new ConceptApplication();
return await app.run();
}
}

export default ConceptApplication;