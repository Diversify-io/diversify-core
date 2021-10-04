// If your plugin extends types from another plugin, you should import the plugin here.

// To extend one of Hardhat's types, you need to import the module where it has been defined, and redeclare it.
import 'hardhat/types/config'
import 'hardhat/types/runtime'

// Extension of the Hardhat config.
declare module 'hardhat/types/config' {
  // We extend the UserConfig type, which represents the config as written
  // by the users. Things are normally optional here.
  interface HardhatUserConfig {
    namedAccounts?: {
      [name: string]: string | number | { [network: string]: null | number | string }
    }
  }

  // We also extend the Config type, which represents the configuration
  // after it has been resolved. This is the type used during the execution
  // of tasks, tests and scripts.
  // Normally, you don't want things to be optional here. As you can apply
  // default values using the extendConfig function.
  interface HardhatConfig {
    namedAccounts: {
      [name: string]: string | number | { [network: string]: null | number | string }
    }
  }
}

//  Extension to the Hardhat Runtime Environment.
declare module 'hardhat/types/runtime' {
  interface HardhatRuntimeEnvironment {
    getNamedAccounts: () => Promise<{
      [name: string]: string
    }>
  }
}
