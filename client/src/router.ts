import Vue from 'vue';
import Router from 'vue-router';
import container from './model/ModelContainer';
import IScrollPositionState from './model/state/IScrollPositionState';
import Dashboard from './views/Dashboard.vue';
import Encode from './views/Encode.vue';
import Guide from './views/Guide.vue';
import OnAir from './views/OnAir.vue';
import Recorded from './views/Recorded.vue';
import RecordedDetail from './views/RecordedDetail.vue';
import Recording from './views/Recording.vue';
import Reserves from './views/Reserves.vue';
import Rule from './views/Rule.vue';
import Search from './views/Search.vue';
import Settings from './views/Settings.vue';
import WatchOnAir from './views/WatchOnAir.vue';
import WatchRecorded from './views/WatchRecorded.vue';
import WatchRecordedStreaming from './views/WatchRecordedStreaming.vue';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'dashboard',
            component: Dashboard,
        },
        {
            path: '/onair',
            name: 'onair',
            component: OnAir,
        },
        {
            path: '/onair/watch',
            name: 'watch-onair',
            component: WatchOnAir,
        },
        {
            path: '/guide',
            name: 'guide',
            component: Guide,
        },
        {
            path: '/reserves',
            name: 'reserves',
            component: Reserves,
        },
        {
            path: '/recording',
            name: 'recording',
            component: Recording,
        },
        {
            path: '/recorded',
            name: 'recorded',
            component: Recorded,
        },
        {
            path: '/recorded/watch',
            name: 'recorded-watch',
            component: WatchRecorded,
        },
        {
            path: '/recorded/detail/:id',
            name: 'recorded-detail',
            component: RecordedDetail,
        },
        {
            path: '/recorded/streaming/:id',
            name: 'recorded-streaming',
            component: WatchRecordedStreaming,
        },
        {
            path: '/encode',
            name: 'encode',
            component: Encode,
        },
        {
            path: '/search',
            name: 'search',
            component: Search,
        },
        {
            path: '/rule',
            name: 'rule',
            component: Rule,
        },
        {
            path: '/settings',
            name: 'settings',
            component: Settings,
        },
    ],
    scrollBehavior: async (_to, _from, savedPosition) => {
        // ページデータが取得されるまで待つ
        const scrollState: IScrollPositionState = container.get<IScrollPositionState>('IScrollPositionState');
        await scrollState.onDoneGetData();

        return savedPosition ? savedPosition : { x: 0, y: 0 };
    },
});
