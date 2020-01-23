import { historyStore } from './historyStore.js';
import { pageStore } from './pageStore.js';

import { loadData } from './loadData.js';

export async function loadPage( url = false, title = false ) {

	let state = {
		title: title || document.title.replace('CDA ',''),
		url: url || window.location.href
	}

	pageStore.set({...state, loading: true});
	historyStore.update(l => [...l, state]);

	// load data
	let data = await loadData( state.url );

	// replace info in page object and history
	pageStore.set({...data , loading: false });

	// naviWorld( entity.worlditem );
	// relocate();

	state = {
		title: data.title,
		url: data.url,
		template: data.template,
		worlditem: data.worlditem
	}

	history.replaceState( state, state.title, state.url );

	historyStore.update( l => {
		l[l.length-1] = state;
		return l;
	});

}
