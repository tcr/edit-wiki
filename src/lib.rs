#![feature(collections)]
#![allow(unused_variables)]
#![allow(dead_code)]
#![allow(unused_imports)]

mod doc;

use std::collections::HashMap;
use doc::{DocSpan, DocElement, DelSpan, DelElement, AddSpan, AddElement, Atom, Op};
use doc::DocElement::*;
use doc::DelElement::*;
use doc::AddElement::*;
use std::borrow::ToOwned;

pub fn debug_span(val:&DocSpan) {
	for i in val {
		debug_elem(i);
	}
}

pub fn debug_elem(val:&DocElement) {
	match val {
		&DocChars(ref value) => {
			println!("str({})", value);
		},
		&DocGroup(ref attrs, ref span) => {
			println!("attrs({})", attrs.capacity());
			println!("span({})", span.capacity());
		},
	}
}

pub fn iterate(span:&DocSpan) -> Vec<Atom> {
	let mut atoms = vec![];
	for elem in span {
		match elem {
			&DocChars(ref value) => {
				for c in value.chars() {
					atoms.push(Atom::Char(c));
				}
			},
			&DocGroup(ref attrs, ref span) => {
				atoms.push(Atom::Enter(attrs.clone()));
				atoms.append(&mut iterate(span));
				atoms.push(Atom::Leave);
			},
		}
	}
	atoms
}

fn place_chars(res:&mut DocSpan, value:String) {
	if res.len() > 0 {
		let idx = res.len() - 1;
		if let &mut DocChars(ref mut prefix) = &mut res[idx] {
			prefix.push_str(&value[..]);
			return;
		}
	}
	res.push(DocChars(value));
}

fn place_any(res:&mut DocSpan, value:&DocElement) {
	match value {
		&DocChars(ref string) => {
			place_chars(res, string.clone());
		},
		_ => {
			res.push(value.clone());
		}
	}
}

pub fn apply_add(spanvec:&DocSpan, delvec:&AddSpan) -> DocSpan {
	let mut span = &spanvec[..];
	let mut del = &delvec[..];

	let mut first = None;
	if span.len() > 0 {
		first = Some(span[0].clone());
		span = &span[1..]
	}

	let mut res:DocSpan = Vec::with_capacity(span.len());
	
	let mut d = del[0].clone();
	del = &del[1..];

	loop {
		let mut nextdel = true;
		let mut nextfirst = true;

		match d.clone() {
			AddSkip(count) => {
				match first.clone().unwrap() {
					DocChars(ref value) => {
						let len = value.chars().count();
						if len < count {
							d = AddSkip(count - len);
							nextdel = false;
						} else if len > count {
							place_chars(&mut res, value[0..count].to_owned());
							first = Some(DocChars(value[count..len].to_owned()));
							nextfirst = false;
						}
					},
					DocGroup(..) => {
						res.push(first.clone().unwrap());
						if count > 1 {
							d = AddSkip(count - 1);
							nextdel = false;
						}
					},
				}
			},
			AddWithGroup(ref delspan) => {
				match first.clone().unwrap() {
					DocGroup(ref attrs, ref span) => {
						res.push(DocGroup(attrs.clone(), apply_add(span, delspan)));
					},
					_ => {
						panic!("Invalid DelGroup");
					}
				}
			},
			AddChars(value) => {
				place_chars(&mut res, value);
				nextfirst = false;
			},
			AddGroup(attrs, innerspan) => {
				res.push(DocGroup(attrs, apply_add(&vec![], &innerspan)));
				nextfirst = false;
			},	
		}

		if nextdel {
			if del.len() == 0 {
				if !nextfirst && !first.is_none() {
					place_any(&mut res, &first.clone().unwrap());
				}
				if span.len() > 0 {
					place_any(&mut res, &span[0]);
					res.push_all(&span[1..]);
				}
				break;
			}

			d = del[0].clone();
			del = &del[1..];
		}

		if nextfirst {
			if span.len() == 0 {
				panic!("exhausted document");
			}

			first = Some(span[0].clone());
			span = &span[1..];
		}
	}

	res
}

pub fn apply_delete(spanvec:&DocSpan, delvec:&DelSpan) -> DocSpan {
	let mut span = &spanvec[..];
	let mut del = &delvec[..];

	let mut first = span[0].clone();
	span = &span[1..];

	let mut res:DocSpan = Vec::with_capacity(span.len());
	
	let mut d = del[0].clone();
	del = &del[1..];

	loop {
		let mut nextdel = true;
		let mut nextfirst = true;

		match d.clone() {
			DelSkip(count) => {
				match first.clone() {
					DocChars(ref value) => {
						let len = value.chars().count();
						if len < count {
							d = DelSkip(count - len);
							nextdel = false;
						} else if len > count {
							place_chars(&mut res, value[0..count].to_owned());
							first = DocChars(value[count..len].to_owned());
							nextfirst = false;
						}
					},
					DocGroup(..) => {
						res.push(first.clone());
						if count > 1 {
							d = DelSkip(count - 1);
							nextdel = false;
						}
					},
				}
			},
			DelWithGroup(ref delspan) => {
				match first.clone() {
					DocGroup(ref attrs, ref span) => {
						res.push(DocGroup(attrs.clone(), apply_delete(span, delspan)));
					},
					_ => {
						panic!("Invalid DelGroup");
					}
				}
			},
			DelChars(count) => {
				match first.clone() {
					DocChars(ref value) => {
						let len = value.chars().count();
						if len > count {
							first = DocChars(value[count..len].to_owned());
							nextfirst = false;
						} else if len < count {
							panic!("attempted deletion of too much");
						}
					},
					_ => {
						panic!("Invalid DelChars");
					}
				}
			},
			DelGroup => {
				match first.clone() {
					DocGroup(..) => {},
					_ => {
						panic!("Invalid DelGroup");
					}
				}
			},
		}

		if nextdel {
			if del.len() == 0 {
				if !nextfirst {
					place_any(&mut res, &first)
				}
				if span.len() > 0 {
					place_any(&mut res, &span[0]);
					res.push_all(&span[1..]);
				}
				break;
			}

			d = del[0].clone();
			del = &del[1..];
		}

		if nextfirst {
			if span.len() == 0 {
				panic!("exhausted document");
			}

			first = span[0].clone();
			span = &span[1..];
		}
	}

	res
}

pub fn apply_operation(spanvec:&DocSpan, delvec:&DelSpan, addvec:&AddSpan) -> DocSpan {
	apply_add(&apply_delete(spanvec, delvec), addvec)
}

#[test]
fn try_this() {
	let source:DocSpan = vec![
		DocChars("Hello world!".to_owned()),
		DocGroup(HashMap::new(), vec![]),
	];

	debug_span(&source);
	
	assert_eq!(iterate(&vec![
		DocChars("Hello world!".to_owned()),
		DocGroup(HashMap::new(), vec![]),
	]), vec![
		Atom::Char('H'),
		Atom::Char('e'),
		Atom::Char('l'),
		Atom::Char('l'),
		Atom::Char('o'),
		Atom::Char(' '),
		Atom::Char('w'),
		Atom::Char('o'),
		Atom::Char('r'),
		Atom::Char('l'),
		Atom::Char('d'),
		Atom::Char('!'),
		Atom::Enter(HashMap::new()),
		Atom::Leave,
	]);

	assert_eq!(apply_delete(&vec![
		DocChars("Hello world!".to_owned()),
		DocGroup(HashMap::new(), vec![]),
	], &vec![
		DelChars(3),
		DelSkip(2),
		DelChars(1),
		DelSkip(1),
		DelChars(5),
		DelGroup,
	]), vec![
		DocChars("low".to_owned()),
	]);

	assert_eq!(apply_delete(&vec![
		DocChars("Hello World!".to_owned()),
	], &vec![
		DelChars(6),
	]), vec![
		DocChars("World!".to_owned()),
	]);

	assert_eq!(apply_add(&vec![
		DocChars("World!".to_owned()),
	], &vec![
		AddChars("Hello ".to_owned()),
	]), vec![
		DocChars("Hello World!".to_owned()),
	]);

	assert_eq!(apply_add(&vec![
		DocGroup(HashMap::new(), vec![]),
		DocChars("World!".to_owned()),
	], &vec![
		AddSkip(1),
		AddChars("Hello ".to_owned()),
	]), vec![
		DocGroup(HashMap::new(), vec![]),
		DocChars("Hello World!".to_owned()),
	]);

	assert_eq!(apply_delete(&vec![
		DocGroup(HashMap::new(), vec![
			DocChars("Hello Damned World!".to_owned()),
		]),
	], &vec![
		DelWithGroup(vec![
			DelSkip(6),
			DelChars(7),
		]),
	]), vec![
		DocGroup(HashMap::new(), vec![
			DocChars("Hello World!".to_owned()),
		]),
	]);

	assert_eq!(apply_add(&vec![
		DocGroup(HashMap::new(), vec![
			DocChars("Hello!".to_owned()),
		]),
	], &vec![
		AddWithGroup(vec![
			AddSkip(5),
			AddChars(" World".to_owned()),
		]),
	]), vec![
		DocGroup(HashMap::new(), vec![
			DocChars("Hello World!".to_owned()),
		]),
	]);

	assert_eq!(apply_operation(&vec![
		DocChars("Goodbye World!".to_owned()),
	], &vec![
		DelChars(7),
	], &vec![
		AddChars("Hello".to_owned()),
	]), vec![
		DocChars("Hello World!".to_owned()),
	]);
}
