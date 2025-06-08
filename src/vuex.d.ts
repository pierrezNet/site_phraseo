declare module 'vuex' {
    import { Store } from 'vuex';
    import { CommitOptions, DispatchOptions } from 'vuex';
    import { ComponentCustomProperties } from 'vue';
  
    interface StoreOptions<S> {
      state?: S;
      mutations?: any;
      actions?: any;
      getters?: any;
      modules?: any;
      plugins?: any;
      strict?: boolean;
    }
  
    interface CustomStore extends Store<any> {}
  
    interface ComponentCustomProperties {
      $store: CustomStore;
    }
  }
  