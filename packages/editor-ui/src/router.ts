import { useStorage } from '@/composables/useStorage';

import type {
	NavigationGuardNext,
	RouteLocation,
	RouteRecordRaw,
	RouteLocationRaw,
	RouteLocationNormalized,
} from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
import { runExternalHook } from '@/utils/externalHooks';
import { ROLE } from '@/utils/userUtils';
import { useSettingsStore } from '@/stores/settings.store';
import { useTemplatesStore } from '@/stores/templates.store';
import { useUIStore } from '@/stores/ui.store';
import { useSSOStore } from '@/stores/sso.store';
import { EnterpriseEditionFeature, VIEWS } from '@/constants';
import { useTelemetry } from '@/composables/useTelemetry';
import { middleware } from '@/rbac/middleware';
import type { RouteConfig, RouterMiddleware } from '@/types/router';
import { initializeCore } from '@/init';

const ChangePasswordView = async () => import('./views/ChangePasswordView.vue');
const ErrorView = async () => import('./views/ErrorView.vue');
const ForgotMyPasswordView = async () => import('./views/ForgotMyPasswordView.vue');
const MainHeader = async () => import('@/components/MainHeader/MainHeader.vue');
const MainSidebar = async () => import('@/components/MainSidebar.vue');
const NodeView = async () => import('@/views/NodeView.vue');
const WorkflowExecutionsList = async () => import('@/components/ExecutionsView/ExecutionsList.vue');
const ExecutionsLandingPage = async () =>
	import('@/components/ExecutionsView/ExecutionsLandingPage.vue');
const ExecutionPreview = async () => import('@/components/ExecutionsView/ExecutionPreview.vue');
const SettingsView = async () => import('./views/SettingsView.vue');
const SettingsLdapView = async () => import('./views/SettingsLdapView.vue');
const SettingsPersonalView = async () => import('./views/SettingsPersonalView.vue');
const SettingsUsersView = async () => import('./views/SettingsUsersView.vue');
const SettingsCommunityNodesView = async () => import('./views/SettingsCommunityNodesView.vue');
const SettingsApiView = async () => import('./views/SettingsApiView.vue');
const SettingsLogStreamingView = async () => import('./views/SettingsLogStreamingView.vue');
const SettingsFakeDoorView = async () => import('./views/SettingsFakeDoorView.vue');
const SetupView = async () => import('./views/SetupView.vue');
const SigninView = async () => import('./views/SigninView.vue');
const SignupView = async () => import('./views/SignupView.vue');
const TemplatesCollectionView = async () => import('@/views/TemplatesCollectionView.vue');
const TemplatesWorkflowView = async () => import('@/views/TemplatesWorkflowView.vue');
const SetupWorkflowFromTemplateView = async () =>
	import('@/views/SetupWorkflowFromTemplateView/SetupWorkflowFromTemplateView.vue');
const TemplatesSearchView = async () => import('@/views/TemplatesSearchView.vue');
const CredentialsView = async () => import('@/views/CredentialsView.vue');
const ExecutionsView = async () => import('@/views/ExecutionsView.vue');
const WorkflowsView = async () => import('@/views/WorkflowsView.vue');
const VariablesView = async () => import('@/views/VariablesView.vue');
const SettingsUsageAndPlan = async () => import('./views/SettingsUsageAndPlan.vue');
const SettingsSso = async () => import('./views/SettingsSso.vue');
const SignoutView = async () => import('@/views/SignoutView.vue');
const SamlOnboarding = async () => import('@/views/SamlOnboarding.vue');
const SettingsSourceControl = async () => import('./views/SettingsSourceControl.vue');
const SettingsExternalSecrets = async () => import('./views/SettingsExternalSecrets.vue');
const SettingsAuditLogs = async () => import('./views/SettingsAuditLogs.vue');
const WorkerView = async () => import('./views/WorkerView.vue');
const WorkflowHistory = async () => import('@/views/WorkflowHistory.vue');
const WorkflowOnboardingView = async () => import('@/views/WorkflowOnboardingView.vue');

function getTemplatesRedirect(defaultRedirect: VIEWS[keyof VIEWS]) {
	const settingsStore = useSettingsStore();
	const isTemplatesEnabled: boolean = settingsStore.isTemplatesEnabled;
	if (!isTemplatesEnabled) {
		return { name: defaultRedirect || VIEWS.NOT_FOUND };
	}

	return false;
}

export const routes = [
	{
		path: '/',
		name: VIEWS.HOMEPAGE,
		redirect: (to) => {
			return { name: VIEWS.WORKFLOWS };
		},
		meta: {
			middleware: ['authenticated'],
		},
	},
	{
		path: '/collections/:id',
		name: VIEWS.COLLECTION,
		components: {
			default: TemplatesCollectionView,
			sidebar: MainSidebar,
		},
		meta: {
			templatesEnabled: true,
			telemetry: {
				getProperties(route: RouteLocation) {
					const templatesStore = useTemplatesStore();
					return {
						collection_id: route.params.id,
						wf_template_repo_session_id: templatesStore.currentSessionId,
					};
				},
			},
			getRedirect: getTemplatesRedirect,
			middleware: ['authenticated'],
		},
	},
	{
		path: '/templates/:id',
		name: VIEWS.TEMPLATE,
		components: {
			default: TemplatesWorkflowView,
			sidebar: MainSidebar,
		},
		meta: {
			templatesEnabled: true,
			getRedirect: getTemplatesRedirect,
			telemetry: {
				getProperties(route: RouteLocation) {
					const templatesStore = useTemplatesStore();
					return {
						template_id: route.params.id,
						wf_template_repo_session_id: templatesStore.currentSessionId,
					};
				},
			},
			middleware: ['authenticated'],
		},
	},
	{
		path: '/templates/:id/setup',
		name: VIEWS.TEMPLATE_SETUP,
		components: {
			default: SetupWorkflowFromTemplateView,
			sidebar: MainSidebar,
		},
		meta: {
			templatesEnabled: true,
			getRedirect: getTemplatesRedirect,
			telemetry: {
				getProperties(route: RouteLocation) {
					const templatesStore = useTemplatesStore();
					return {
						template_id: route.params.id,
						wf_template_repo_session_id: templatesStore.currentSessionId,
					};
				},
			},
			middleware: ['authenticated'],
		},
	},
	{
		path: '/templates/',
		name: VIEWS.TEMPLATES,
		components: {
			default: TemplatesSearchView,
			sidebar: MainSidebar,
		},
		meta: {
			templatesEnabled: true,
			getRedirect: getTemplatesRedirect,
			// Templates view remembers it's scroll position on back
			scrollOffset: 0,
			telemetry: {
				getProperties(route: RouteLocation) {
					const templatesStore = useTemplatesStore();
					return {
						wf_template_repo_session_id: templatesStore.currentSessionId,
					};
				},
			},
			setScrollPosition(pos: number) {
				this.scrollOffset = pos;
			},
			middleware: ['authenticated'],
		},
	},
	{
		path: '/credentials',
		name: VIEWS.CREDENTIALS,
		components: {
			default: CredentialsView,
			sidebar: MainSidebar,
		},
		meta: {
			middleware: ['authenticated'],
		},
	},
	{
		path: '/variables',
		name: VIEWS.VARIABLES,
		components: {
			default: VariablesView,
			sidebar: MainSidebar,
		},
		meta: { middleware: ['authenticated'] },
	},
	{
		path: '/executions',
		name: VIEWS.EXECUTIONS,
		components: {
			default: ExecutionsView,
			sidebar: MainSidebar,
		},
		meta: {
			middleware: ['authenticated'],
		},
	},
	{
		path: '/workflows',
		name: VIEWS.WORKFLOWS,
		components: {
			default: WorkflowsView,
			sidebar: MainSidebar,
		},
		meta: {
			middleware: ['authenticated'],
		},
	},
	{
		path: '/workflow/:name/debug/:executionId',
		name: VIEWS.EXECUTION_DEBUG,
		components: {
			default: NodeView,
			header: MainHeader,
			sidebar: MainSidebar,
		},
		meta: {
			nodeView: true,
			keepWorkflowAlive: true,
			middleware: ['authenticated', 'enterprise'],
			middlewareOptions: {
				enterprise: {
					feature: [EnterpriseEditionFeature.DebugInEditor],
				},
			},
		},
	},
	{
		path: '/workflow/:name/executions',
		name: VIEWS.WORKFLOW_EXECUTIONS,
		components: {
			default: WorkflowExecutionsList,
			header: MainHeader,
			sidebar: MainSidebar,
		},
		meta: {
			keepWorkflowAlive: true,
			middleware: ['authenticated'],
		},
		children: [
			{
				path: '',
				name: VIEWS.EXECUTION_HOME,
				components: {
					executionPreview: ExecutionsLandingPage,
				},
				meta: {
					keepWorkflowAlive: true,
					middleware: ['authenticated'],
				},
			},
			{
				path: ':executionId',
				name: VIEWS.EXECUTION_PREVIEW,
				components: {
					executionPreview: ExecutionPreview,
				},
				meta: {
					keepWorkflowAlive: true,
					middleware: ['authenticated'],
				},
			},
		],
	},
	{
		path: '/workflow/:workflowId/history/:versionId?',
		name: VIEWS.WORKFLOW_HISTORY,
		components: {
			default: WorkflowHistory,
			sidebar: MainSidebar,
		},
		meta: {
			middleware: ['authenticated', 'enterprise'],
			middlewareOptions: {
				enterprise: {
					feature: [EnterpriseEditionFeature.WorkflowHistory],
				},
			},
		},
	},
	{
		path: '/workflows/templates/:id',
		name: VIEWS.TEMPLATE_IMPORT,
		components: {
			default: NodeView,
			header: MainHeader,
			sidebar: MainSidebar,
		},
		meta: {
			templatesEnabled: true,
			keepWorkflowAlive: true,
			getRedirect: getTemplatesRedirect,
			middleware: ['authenticated'],
		},
	},
	{
		path: '/workflows/onboarding/:id',
		name: VIEWS.WORKFLOW_ONBOARDING,
		components: {
			default: WorkflowOnboardingView,
			header: MainHeader,
			sidebar: MainSidebar,
		},
		meta: {
			templatesEnabled: true,
			keepWorkflowAlive: true,
			getRedirect: () => getTemplatesRedirect(VIEWS.NEW_WORKFLOW),
			middleware: ['authenticated'],
		},
	},
	{
		path: '/workflow/new',
		name: VIEWS.NEW_WORKFLOW,
		components: {
			default: NodeView,
			header: MainHeader,
			sidebar: MainSidebar,
		},
		meta: {
			nodeView: true,
			keepWorkflowAlive: true,
			middleware: ['authenticated'],
		},
	},
	{
		path: '/workflows/demo',
		name: VIEWS.DEMO,
		components: {
			default: NodeView,
		},
		meta: {
			middleware: ['authenticated'],
		},
	},
	{
		path: '/workflow/:name',
		name: VIEWS.WORKFLOW,
		components: {
			default: NodeView,
			header: MainHeader,
			sidebar: MainSidebar,
		},
		meta: {
			nodeView: true,
			keepWorkflowAlive: true,
			middleware: ['authenticated'],
		},
	},
	{
		path: '/workflow',
		redirect: '/workflow/new',
	},
	{
		path: '/signin',
		name: VIEWS.SIGNIN,
		components: {
			default: SigninView,
		},
		meta: {
			telemetry: {
				pageCategory: 'auth',
			},
			middleware: ['guest'],
		},
	},
	{
		path: '/signup',
		name: VIEWS.SIGNUP,
		components: {
			default: SignupView,
		},
		meta: {
			telemetry: {
				pageCategory: 'auth',
			},
			middleware: ['guest'],
		},
	},
	{
		path: '/signout',
		name: VIEWS.SIGNOUT,
		components: {
			default: SignoutView,
		},
		meta: {
			telemetry: {
				pageCategory: 'auth',
			},
			middleware: ['authenticated'],
		},
	},
	{
		path: '/setup',
		name: VIEWS.SETUP,
		components: {
			default: SetupView,
		},
		meta: {
			middleware: ['role'],
			middlewareOptions: {
				role: [ROLE.Default],
			},
			telemetry: {
				pageCategory: 'auth',
			},
		},
	},
	{
		path: '/forgot-password',
		name: VIEWS.FORGOT_PASSWORD,
		components: {
			default: ForgotMyPasswordView,
		},
		meta: {
			middleware: ['guest'],
			telemetry: {
				pageCategory: 'auth',
			},
		},
	},
	{
		path: '/change-password',
		name: VIEWS.CHANGE_PASSWORD,
		components: {
			default: ChangePasswordView,
		},
		meta: {
			middleware: ['guest'],
			telemetry: {
				pageCategory: 'auth',
			},
		},
	},
	{
		path: '/settings',
		component: SettingsView,
		props: true,
		children: [
			{
				path: 'usage',
				name: VIEWS.USAGE,
				components: {
					settingsView: SettingsUsageAndPlan,
				},
				meta: {
					middleware: ['authenticated', 'custom'],
					middlewareOptions: {
						custom: () => {
							const settingsStore = useSettingsStore();
							return !(
								settingsStore.settings.hideUsagePage ||
								settingsStore.settings.deployment?.type === 'cloud'
							);
						},
					},
					telemetry: {
						pageCategory: 'settings',
						getProperties(route: RouteLocation) {
							return {
								feature: 'usage',
							};
						},
					},
				},
			},
			{
				path: 'personal',
				name: VIEWS.PERSONAL_SETTINGS,
				components: {
					settingsView: SettingsPersonalView,
				},
				meta: {
					middleware: ['authenticated', 'role'],
					middlewareOptions: {
						role: [ROLE.Owner, ROLE.Member],
					},
					telemetry: {
						pageCategory: 'settings',
						getProperties(route: RouteLocation) {
							return {
								feature: 'personal',
							};
						},
					},
				},
			},
			{
				path: 'users',
				name: VIEWS.USERS_SETTINGS,
				components: {
					settingsView: SettingsUsersView,
				},
				meta: {
					middleware: ['authenticated', 'rbac'],
					middlewareOptions: {
						rbac: {
							scope: ['user:create', 'user:update'],
						},
					},
					telemetry: {
						pageCategory: 'settings',
						getProperties(route: RouteLocation) {
							return {
								feature: 'users',
							};
						},
					},
				},
			},
			{
				path: 'api',
				name: VIEWS.API_SETTINGS,
				components: {
					settingsView: SettingsApiView,
				},
				meta: {
					middleware: ['authenticated', 'custom'],
					middlewareOptions: {
						custom: () => {
							const settingsStore = useSettingsStore();
							return settingsStore.isPublicApiEnabled;
						},
					},
					telemetry: {
						pageCategory: 'settings',
						getProperties(route: RouteLocation) {
							return {
								feature: 'api',
							};
						},
					},
				},
			},
			{
				path: 'environments',
				name: VIEWS.SOURCE_CONTROL,
				components: {
					settingsView: SettingsSourceControl,
				},
				meta: {
					middleware: ['authenticated', 'role'],
					middlewareOptions: {
						role: [ROLE.Owner],
					},
					telemetry: {
						pageCategory: 'settings',
						getProperties(route: RouteLocation) {
							return {
								feature: 'environments',
							};
						},
					},
				},
			},
			{
				path: 'external-secrets',
				name: VIEWS.EXTERNAL_SECRETS_SETTINGS,
				components: {
					settingsView: SettingsExternalSecrets,
				},
				meta: {
					middleware: ['authenticated', 'role'],
					middlewareOptions: {
						role: [ROLE.Owner],
					},
					telemetry: {
						pageCategory: 'settings',
						getProperties(route: RouteLocation) {
							return {
								feature: 'external-secrets',
							};
						},
					},
				},
			},
			{
				path: 'sso',
				name: VIEWS.SSO_SETTINGS,
				components: {
					settingsView: SettingsSso,
				},
				meta: {
					middleware: ['authenticated', 'role', 'custom'],
					middlewareOptions: {
						custom: () => {
							const settingsStore = useSettingsStore();
							return !settingsStore.isDesktopDeployment;
						},
						role: [ROLE.Owner],
					},
					telemetry: {
						pageCategory: 'settings',
						getProperties(route: RouteLocation) {
							return {
								feature: 'sso',
							};
						},
					},
				},
			},
			{
				path: 'log-streaming',
				name: VIEWS.LOG_STREAMING_SETTINGS,
				components: {
					settingsView: SettingsLogStreamingView,
				},
				meta: {
					middleware: ['authenticated', 'role'],
					middlewareOptions: {
						role: [ROLE.Owner],
					},
					telemetry: {
						pageCategory: 'settings',
					},
				},
			},
			{
				path: 'workers',
				name: VIEWS.WORKER_VIEW,
				components: {
					settingsView: WorkerView,
				},
				meta: {
					middleware: ['authenticated'],
				},
			},
			{
				path: 'community-nodes',
				name: VIEWS.COMMUNITY_NODES,
				components: {
					settingsView: SettingsCommunityNodesView,
				},
				meta: {
					middleware: ['authenticated', 'role', 'custom'],
					middlewareOptions: {
						role: [ROLE.Owner],
						custom: () => {
							const settingsStore = useSettingsStore();
							return settingsStore.isCommunityNodesFeatureEnabled;
						},
					},
					telemetry: {
						pageCategory: 'settings',
					},
				},
			},
			{
				path: 'coming-soon/:featureId',
				name: VIEWS.FAKE_DOOR,
				components: {
					settingsView: SettingsFakeDoorView,
				},
				meta: {
					middleware: ['authenticated'],
					telemetry: {
						pageCategory: 'settings',
						getProperties(route: RouteLocation) {
							return {
								feature: route.params.featureId,
							};
						},
					},
				},
			},
			{
				path: 'ldap',
				name: VIEWS.LDAP_SETTINGS,
				components: {
					settingsView: SettingsLdapView,
				},
				meta: {
					middleware: ['authenticated', 'role'],
					middlewareOptions: {
						role: [ROLE.Owner],
					},
				},
			},
			{
				path: 'audit-logs',
				name: VIEWS.AUDIT_LOGS,
				components: {
					settingsView: SettingsAuditLogs,
				},
				meta: {
					middleware: ['authenticated', 'role', 'custom'],
					middlewareOptions: {
						custom: () => {
							return !!useStorage('audit-logs').value;
						},
						role: [ROLE.Owner],
					},
					telemetry: {
						pageCategory: 'settings',
						getProperties(route: RouteLocation) {
							return {
								feature: 'audit-logs',
							};
						},
					},
				},
			},
		],
	},
	{
		path: '/saml/onboarding',
		name: VIEWS.SAML_ONBOARDING,
		components: {
			default: SamlOnboarding,
		},
		meta: {
			middleware: ['authenticated', 'custom'],
			middlewareOptions: {
				custom: () => {
					const settingsStore = useSettingsStore();
					const ssoStore = useSSOStore();
					return (
						ssoStore.isEnterpriseSamlEnabled &&
						!settingsStore.isCloudDeployment &&
						!settingsStore.isDesktopDeployment
					);
				},
			},
			telemetry: {
				pageCategory: 'auth',
			},
		},
	},
	{
		path: '/:pathMatch(.*)*',
		name: VIEWS.NOT_FOUND,
		component: ErrorView,
		props: {
			messageKey: 'error.pageNotFound',
			errorCode: 404,
			redirectTextKey: 'error.goBack',
			redirectPage: VIEWS.HOMEPAGE,
		},
		meta: {
			nodeView: true,
			telemetry: {
				disabled: true,
			},
		},
	},
] as Array<RouteRecordRaw & RouteConfig>;

const router = createRouter({
	history: createWebHistory(import.meta.env.DEV ? '/' : window.BASE_PATH ?? '/'),
	scrollBehavior(to: RouteLocationNormalized & RouteConfig, from, savedPosition) {
		// saved position == null means the page is NOT visited from history (back button)
		if (savedPosition === null && to.name === VIEWS.TEMPLATES && to.meta?.setScrollPosition) {
			// for templates view, reset scroll position in this case
			to.meta.setScrollPosition(0);
		}
	},
	routes,
});

router.beforeEach(async (to: RouteLocationNormalized & RouteConfig, from, next) => {
	/**
	 * Initialize application core
	 * This step executes before first route is loaded and is required for permission checks
	 */

	await initializeCore();

	/**
	 * Redirect to setup page. User should be redirected to this only once
	 */

	const settingsStore = useSettingsStore();
	if (settingsStore.showSetupPage) {
		if (to.name === VIEWS.SETUP) {
			return next();
		}

		return next({ name: VIEWS.SETUP });
	}

	/**
	 * Verify user permissions for current route
	 */

	const routeMiddleware = to.meta?.middleware ?? [];
	const routeMiddlewareOptions = to.meta?.middlewareOptions ?? {};
	for (const middlewareName of routeMiddleware) {
		let nextCalled = false;
		const middlewareNext = ((location: RouteLocationRaw): void => {
			next(location);
			nextCalled = true;
		}) as NavigationGuardNext;

		const middlewareOptions = routeMiddlewareOptions[middlewareName];
		const middlewareFn = middleware[middlewareName] as RouterMiddleware<unknown>;
		await middlewareFn(to, from, middlewareNext, middlewareOptions);

		if (nextCalled) {
			return;
		}
	}

	return next();
});

router.afterEach((to, from) => {
	const telemetry = useTelemetry();
	const uiStore = useUIStore();
	const templatesStore = useTemplatesStore();

	/**
	 * Run external hooks
	 */

	void runExternalHook('main.routeChange', { from, to });

	/**
	 * Track current view for telemetry
	 */

	uiStore.currentView = (to.name as string) ?? '';
	if (to.meta?.templatesEnabled) {
		templatesStore.setSessionId();
	} else {
		templatesStore.resetSessionId(); // reset telemetry session id when user leaves template pages
	}
	telemetry.page(to);
});

export default router;
